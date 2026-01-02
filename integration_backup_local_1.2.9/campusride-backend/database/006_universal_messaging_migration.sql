-- Migration: Update Messages System for Universal Messaging Support
-- Date: 2025-11-13
-- Purpose: Allow messages not tied to activities + add context fields

-- ===============================================
-- Step 1: Modify messages table structure
-- ===============================================

-- Add new context fields
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS context_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS context_id VARCHAR(255) NULL;

-- Make activity_id nullable for general messages
ALTER TABLE messages ALTER COLUMN activity_id DROP NOT NULL;

-- Update message_type enum to include new types
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_message_type_check
CHECK (message_type IN ('activity_inquiry', 'activity_update', 'general', 'support'));

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_messages_context_type ON messages(context_type);
CREATE INDEX IF NOT EXISTS idx_messages_context_id ON messages(context_id);

-- ===============================================
-- Step 2: Create universal message thread function
-- ===============================================

-- Updated function for creating message threads (activity_id optional)
CREATE OR REPLACE FUNCTION create_universal_message_thread(
  sender_id_param UUID,
  receiver_id_param UUID,
  subject_param VARCHAR(255),
  content_param TEXT,
  message_type_param VARCHAR(20) DEFAULT 'general',
  activity_id_param UUID DEFAULT NULL,
  context_type_param VARCHAR(50) DEFAULT 'general',
  context_id_param VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_thread_id UUID;
  new_message_id UUID;
BEGIN
  -- Generate new thread ID
  new_thread_id := uuid_generate_v4();

  -- Create the first message
  INSERT INTO messages (
    id, activity_id, sender_id, receiver_id, subject, content,
    message_type, context_type, context_id, thread_id
  ) VALUES (
    uuid_generate_v4(), activity_id_param, sender_id_param, receiver_id_param,
    subject_param, content_param, message_type_param,
    context_type_param, context_id_param, new_thread_id
  ) RETURNING id INTO new_message_id;

  -- Add participants to the thread
  INSERT INTO message_participants (thread_id, user_id, joined_at)
  VALUES
    (new_thread_id, sender_id_param, CURRENT_TIMESTAMP),
    (new_thread_id, receiver_id_param, CURRENT_TIMESTAMP)
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  -- Create notification for receiver (only if notifications table exists)
  BEGIN
    INSERT INTO notifications (
      user_id, type, title, content, data, priority
    ) VALUES (
      receiver_id_param,
      'new_message',
      '新消息: ' || subject_param,
      '您收到了一条新消息',
      jsonb_build_object(
        'message_id', new_message_id,
        'thread_id', new_thread_id,
        'activity_id', activity_id_param,
        'context_type', context_type_param,
        'context_id', context_id_param,
        'sender_id', sender_id_param
      ),
      'medium'
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- Notifications table doesn't exist, skip notification
      NULL;
  END;

  RETURN new_thread_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- Step 3: Update reply function for universal threads
-- ===============================================

-- Updated function for replying to any message thread
CREATE OR REPLACE FUNCTION reply_to_universal_message_thread(
  thread_id_param UUID,
  sender_id_param UUID,
  content_param TEXT,
  reply_to_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
  receiver_id_param UUID;
  activity_id_param UUID;
  context_type_param VARCHAR(50);
  context_id_param VARCHAR(255);
  thread_subject VARCHAR(255);
BEGIN
  -- Get the context and subject from the original thread
  SELECT activity_id, context_type, context_id, subject
  INTO activity_id_param, context_type_param, context_id_param, thread_subject
  FROM messages
  WHERE thread_id = thread_id_param
  ORDER BY created_at ASC
  LIMIT 1;

  -- Find the receiver (the other participant in the thread)
  SELECT user_id INTO receiver_id_param
  FROM message_participants
  WHERE thread_id = thread_id_param
    AND user_id != sender_id_param
    AND status = 'active'
  LIMIT 1;

  -- Create the reply message
  INSERT INTO messages (
    id, activity_id, sender_id, receiver_id, subject, content,
    message_type, context_type, context_id, thread_id, reply_to
  ) VALUES (
    uuid_generate_v4(), activity_id_param, sender_id_param, receiver_id_param,
    'Re: ' || thread_subject, content_param, 'general',
    context_type_param, context_id_param, thread_id_param, reply_to_param
  ) RETURNING id INTO new_message_id;

  -- Update last read time for sender
  UPDATE message_participants
  SET last_read_at = CURRENT_TIMESTAMP
  WHERE thread_id = thread_id_param AND user_id = sender_id_param;

  -- Create notification for receiver (only if notifications table exists)
  BEGIN
    INSERT INTO notifications (
      user_id, type, title, content, data, priority
    ) VALUES (
      receiver_id_param,
      'message_reply',
      '回复: ' || thread_subject,
      '您收到了一条消息回复',
      jsonb_build_object(
        'message_id', new_message_id,
        'thread_id', thread_id_param,
        'activity_id', activity_id_param,
        'context_type', context_type_param,
        'context_id', context_id_param,
        'sender_id', sender_id_param
      ),
      'medium'
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- Notifications table doesn't exist, skip notification
      NULL;
  END;

  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- Step 4: Create helper functions for reply checking
-- ===============================================

-- Function to check if user can send more messages (reply restriction logic)
CREATE OR REPLACE FUNCTION can_user_send_message(
  thread_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  message_count INTEGER;
  last_sender_id UUID;
  consecutive_count INTEGER := 0;
  msg_record RECORD;
BEGIN
  -- Get total message count
  SELECT COUNT(*) INTO message_count
  FROM messages
  WHERE thread_id = thread_id_param AND status = 'active';

  -- If no messages or only one message, allow sending
  IF message_count <= 1 THEN
    RETURN TRUE;
  END IF;

  -- Check the pattern of recent messages
  FOR msg_record IN
    SELECT sender_id, created_at
    FROM messages
    WHERE thread_id = thread_id_param AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 5
  LOOP
    IF last_sender_id IS NULL THEN
      last_sender_id := msg_record.sender_id;
      consecutive_count := 1;
    ELSIF last_sender_id = msg_record.sender_id THEN
      consecutive_count := consecutive_count + 1;
    ELSE
      EXIT; -- Different sender, break the loop
    END IF;
  END LOOP;

  -- If the last message(s) were from current user and they sent more than 1 consecutive
  IF last_sender_id = user_id_param AND consecutive_count >= 1 THEN
    RETURN FALSE; -- Must wait for other person to reply
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- Step 5: Update existing data (if any)
-- ===============================================

-- Update existing messages to have default context values
UPDATE messages
SET
  context_type = CASE
    WHEN activity_id IS NOT NULL THEN 'activity'
    ELSE 'general'
  END,
  context_id = CASE
    WHEN activity_id IS NOT NULL THEN activity_id::VARCHAR
    ELSE NULL
  END
WHERE context_type IS NULL;

-- ===============================================
-- Step 6: Create view for message analytics
-- ===============================================

CREATE OR REPLACE VIEW v_message_thread_summary AS
SELECT
  t.thread_id,
  t.first_message_id,
  t.subject,
  t.context_type,
  t.context_id,
  t.activity_id,
  t.created_at as thread_created_at,
  t.sender_id as thread_creator_id,
  t.receiver_id as thread_recipient_id,
  COUNT(m.id) as total_messages,
  MAX(m.created_at) as last_message_at,
  COUNT(CASE WHEN m.is_read = false THEN 1 END) as unread_count,
  (SELECT sender_id FROM messages WHERE thread_id = t.thread_id ORDER BY created_at DESC LIMIT 1) as last_sender_id
FROM (
  SELECT DISTINCT ON (thread_id)
    thread_id,
    id as first_message_id,
    subject,
    context_type,
    context_id,
    activity_id,
    created_at,
    sender_id,
    receiver_id
  FROM messages
  WHERE status = 'active'
  ORDER BY thread_id, created_at ASC
) t
LEFT JOIN messages m ON m.thread_id = t.thread_id AND m.status = 'active'
GROUP BY t.thread_id, t.first_message_id, t.subject, t.context_type,
         t.context_id, t.activity_id, t.created_at, t.sender_id, t.receiver_id;

-- ===============================================
-- Step 7: Add performance indexes
-- ===============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, is_read, status);
CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_thread ON messages(sender_id, thread_id);

-- Index for reply restriction checking
CREATE INDEX IF NOT EXISTS idx_messages_thread_status_created ON messages(thread_id, status, created_at DESC);

COMMIT;

-- ===============================================
-- Migration Complete
-- ===============================================