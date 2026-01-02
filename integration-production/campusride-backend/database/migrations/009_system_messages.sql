-- System Messages Table
-- Used for admin announcements and user feedback that all users can see

CREATE TABLE IF NOT EXISTS system_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'general', -- 'announcement', 'feedback', 'general'
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_messages_created_at ON system_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_messages_sender_type ON system_messages(sender_type);

-- Track which users have read which system messages
CREATE TABLE IF NOT EXISTS system_message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES system_messages(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_system_message_reads_user ON system_message_reads(user_id);

-- Insert welcome message
INSERT INTO system_messages (sender_id, sender_type, content, message_type, is_pinned)
VALUES (NULL, 'admin', 'Welcome to CampusRide! This is the system announcements channel. Admins will post important updates here, and you can also send feedback.', 'announcement', true)
ON CONFLICT DO NOTHING;
