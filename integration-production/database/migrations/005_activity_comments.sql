-- 005_activity_comments.sql
-- Migration to add activity comments functionality

-- Create activity_comments table
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 5 AND char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_created_at ON activity_comments(created_at DESC);

-- Add RLS policies for activity_comments
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to view comments
CREATE POLICY "activity_comments_select_policy" ON activity_comments
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow users to insert their own comments
CREATE POLICY "activity_comments_insert_policy" ON activity_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own comments
CREATE POLICY "activity_comments_update_policy" ON activity_comments
FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own comments
CREATE POLICY "activity_comments_delete_policy" ON activity_comments
FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_activity_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_activity_comments_updated_at
  BEFORE UPDATE ON activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_comments_updated_at();

-- Add comment count to activities view (if using a view)
-- This can be used for efficient comment counting
CREATE OR REPLACE VIEW activities_with_stats AS
SELECT
  a.*,
  COALESCE(c.comment_count, 0) as comment_count
FROM activities a
LEFT JOIN (
  SELECT
    activity_id,
    COUNT(*) as comment_count
  FROM activity_comments
  GROUP BY activity_id
) c ON a.id = c.activity_id;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_comments TO authenticated;
GRANT USAGE ON SEQUENCE activity_comments_id_seq TO authenticated;