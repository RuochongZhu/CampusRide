-- Local compatibility patch for PostgREST + current backend queries.

-- Users: middleware and services rely on verification_status.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';

UPDATE users
SET verification_status = CASE
  WHEN is_verified = true THEN 'verified'
  ELSE COALESCE(verification_status, 'pending')
END
WHERE verification_status IS NULL OR verification_status = '';

CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- Coupons: user profile queries expect these fields.
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS week_rank INTEGER,
  ADD COLUMN IF NOT EXISTS week_points INTEGER;

UPDATE coupons
SET valid_until = COALESCE(valid_until, expires_at),
    merchant_name = COALESCE(merchant_name, merchant)
WHERE true;

-- Message system: align legacy table with current backend service expectations.
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT 'New Message',
  ADD COLUMN IF NOT EXISTS context_type VARCHAR(50) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS context_id UUID,
  ADD COLUMN IF NOT EXISTS thread_id UUID,
  ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE messages
SET receiver_id = COALESCE(receiver_id, recipient_id)
WHERE receiver_id IS NULL;

UPDATE messages
SET thread_id = COALESCE(thread_id, conversation_id, id)
WHERE thread_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

CREATE TABLE IF NOT EXISTS message_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  notification_settings JSONB DEFAULT '{"email":true,"push":true,"in_app":true}'::jsonb,
  status VARCHAR(20) DEFAULT 'active',
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_participants_thread_id ON message_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_user_id ON message_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_message_participants_status ON message_participants(status);

-- System messages: expected by system-message service.
ALTER TABLE system_messages
  ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE system_messages
SET sender_type = COALESCE(sender_type, 'user')
WHERE sender_type IS NULL;

-- Optional table used by coupon distribution endpoint.
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id UUID,
  merchant_name VARCHAR(255),
  code VARCHAR(100),
  description TEXT,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT false,
  week_rank INTEGER,
  week_points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
