-- Migration: Activity Group Chat and Friends System
-- Date: 2024-12-27
-- Strategy: Hybrid (RLS for frontend reads, Service Role for backend writes)

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

-- =============================================
-- Enable Row Level Security (RLS)
-- =============================================
ALTER TABLE activity_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for activity_chat_messages
-- Frontend users can READ messages from activities they participate in
-- =============================================

-- Allow users to read messages from activities they are part of
CREATE POLICY "Users can read messages in their activities"
ON activity_chat_messages FOR SELECT
USING (
    -- User is the sender
    sender_id = auth.uid()
    OR
    -- User is a participant in the activity
    EXISTS (
        SELECT 1 FROM activity_participants ap
        WHERE ap.activity_id = activity_chat_messages.activity_id
        AND ap.user_id = auth.uid()
    )
    OR
    -- User is the organizer of the activity
    EXISTS (
        SELECT 1 FROM activities a
        WHERE a.id = activity_chat_messages.activity_id
        AND a.organizer_id = auth.uid()
    )
);

-- Allow participants to insert messages (optional - can also go through backend API)
CREATE POLICY "Participants can send messages"
ON activity_chat_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid()
    AND (
        EXISTS (
            SELECT 1 FROM activity_participants ap
            WHERE ap.activity_id = activity_chat_messages.activity_id
            AND ap.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM activities a
            WHERE a.id = activity_chat_messages.activity_id
            AND a.organizer_id = auth.uid()
        )
    )
);

-- Allow users to soft-delete their own messages
CREATE POLICY "Users can delete their own messages"
ON activity_chat_messages FOR UPDATE
USING (sender_id = auth.uid());

-- =============================================
-- RLS Policies for user_friends
-- =============================================

-- Users can see their own friendships
CREATE POLICY "Users can view their friendships"
ON user_friends FOR SELECT
USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON user_friends FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their received requests (accept/reject) or their sent requests
CREATE POLICY "Users can update friendships"
ON user_friends FOR UPDATE
USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Users can remove friendships
CREATE POLICY "Users can remove friendships"
ON user_friends FOR DELETE
USING (user_id = auth.uid() OR friend_id = auth.uid());

-- =============================================
-- Grant full access to service_role (backend)
-- Service role bypasses RLS automatically
-- =============================================
GRANT ALL ON activity_chat_messages TO service_role;
GRANT ALL ON user_friends TO service_role;

-- Also grant to authenticated users for Realtime subscriptions
GRANT SELECT ON activity_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_friends TO authenticated;

-- =============================================
-- Enable Realtime for these tables
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE activity_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE user_friends;

-- Comments
COMMENT ON TABLE activity_chat_messages IS 'Group chat messages for activities with Realtime support';
COMMENT ON TABLE user_friends IS 'User friendship relationships with intro messages';
