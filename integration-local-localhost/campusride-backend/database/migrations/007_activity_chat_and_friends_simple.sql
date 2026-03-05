-- Migration: Activity Group Chat and Friends System (Simplified)
-- Date: 2024-12-27
-- Note: RLS disabled since we use service_role key in backend

-- =============================================
-- Activity Chat Messages Table
-- =============================================
CREATE TABLE IF NOT EXISTS activity_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    attachment_url TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity chat messages
CREATE INDEX IF NOT EXISTS idx_activity_chat_messages_activity_id ON activity_chat_messages(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_chat_messages_sender_id ON activity_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_activity_chat_messages_created_at ON activity_chat_messages(created_at);

-- =============================================
-- User Friends Table
-- =============================================
CREATE TABLE IF NOT EXISTS user_friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    intro_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Indexes for user friends
CREATE INDEX IF NOT EXISTS idx_user_friends_user_id ON user_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_friend_id ON user_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);

-- =============================================
-- Update trigger for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for activity_chat_messages
DROP TRIGGER IF EXISTS update_activity_chat_messages_updated_at ON activity_chat_messages;
CREATE TRIGGER update_activity_chat_messages_updated_at
    BEFORE UPDATE ON activity_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_friends
DROP TRIGGER IF EXISTS update_user_friends_updated_at ON user_friends;
CREATE TRIGGER update_user_friends_updated_at
    BEFORE UPDATE ON user_friends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE activity_chat_messages IS 'Group chat messages for activities';
COMMENT ON TABLE user_friends IS 'User friendship relationships with intro messages';
