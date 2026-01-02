-- Migration: Admin System Announcements and Activity Chat Moderation
-- Date: 2024-12-28
-- Purpose: Add system announcement feature and admin moderation capabilities

-- =============================================
-- 1. Add admin_role field to users table
-- =============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role != 'user';

-- =============================================
-- 2. Create system_announcements table
-- =============================================
CREATE TABLE IF NOT EXISTS system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'general',  -- 'general', 'warning', 'important', 'maintenance'
  priority INTEGER DEFAULT 0,  -- Higher = shows first
  is_pinned BOOLEAN DEFAULT false,
  target_scope VARCHAR(50) DEFAULT 'all',  -- 'all', 'activity_only', 'specific_users'
  target_activity_ids UUID[] DEFAULT NULL,  -- Array of activity IDs if scope is specific

  -- Display settings
  show_in_notification BOOLEAN DEFAULT true,
  show_in_activity_chat BOOLEAN DEFAULT true,
  show_in_dashboard BOOLEAN DEFAULT true,

  -- Lifecycle
  published_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_until TIMESTAMPTZ,  -- When to stop showing this announcement
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT announcement_time_valid CHECK (scheduled_until IS NULL OR scheduled_until > published_at)
);

-- Indexes for announcements
CREATE INDEX IF NOT EXISTS idx_announcements_admin_id ON system_announcements(admin_id);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON system_announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON system_announcements(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON system_announcements(published_at DESC);

-- =============================================
-- 3. Insert system announcements into activity_chat_messages
-- =============================================
-- We'll use message_type = 'system_announcement' to differentiate

-- =============================================
-- 4. Create activity_moderation_logs table
-- =============================================
CREATE TABLE IF NOT EXISTS activity_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,  -- 'delete_message', 'delete_chat', 'remove_participant', 'ban_user'
  target_message_id UUID REFERENCES activity_chat_messages(id),
  target_user_id UUID REFERENCES users(id),
  reason TEXT,
  details JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for moderation logs
CREATE INDEX IF NOT EXISTS idx_moderation_logs_activity_id ON activity_moderation_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON activity_moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON activity_moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON activity_moderation_logs(created_at DESC);

-- =============================================
-- 5. Add soft-delete and message_type improvements
-- =============================================
-- activity_chat_messages already has deleted_at field
-- Ensure message_type has 'system_announcement' option
-- (This is just documentation - the CHECK should be updated in a proper migration)

-- =============================================
-- 6. Create helper view for active announcements
-- =============================================
CREATE OR REPLACE VIEW active_system_announcements AS
SELECT
  id,
  admin_id,
  title,
  content,
  announcement_type,
  priority,
  is_pinned,
  target_scope,
  target_activity_ids,
  published_at,
  scheduled_until
FROM system_announcements
WHERE
  -- Published and not expired
  published_at <= NOW()
  AND (scheduled_until IS NULL OR scheduled_until > NOW())
ORDER BY is_pinned DESC, priority DESC, published_at DESC;

-- =============================================
-- 7. Create trigger for updated_at
-- =============================================
DROP TRIGGER IF EXISTS update_system_announcements_updated_at ON system_announcements;
CREATE TRIGGER update_system_announcements_updated_at
  BEFORE UPDATE ON system_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. Grant permissions
-- =============================================
-- Service role has full access (automatic)
-- Authenticated users have read-only access
GRANT SELECT ON system_announcements TO authenticated;
GRANT SELECT ON active_system_announcements TO authenticated;

-- =============================================
-- 9. Enable Realtime for announcements
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE system_announcements;

-- =============================================
-- 10. Comments for documentation
-- =============================================
COMMENT ON TABLE system_announcements IS 'System-wide announcements that admins can publish to users or specific activities';
COMMENT ON TABLE activity_moderation_logs IS 'Audit log of all moderation actions taken by admins/organizers';
COMMENT ON VIEW active_system_announcements IS 'View of currently active announcements filtered by publish/expiration dates';
COMMENT ON COLUMN system_announcements.target_activity_ids IS 'Array of activity IDs if announcement should only show in specific activities';
COMMENT ON COLUMN system_announcements.scheduled_until IS 'When the announcement should stop being displayed to users';
