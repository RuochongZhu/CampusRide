-- Message System for Activity Communication
-- This allows users to send messages to activity organizers

-- Messages table for activity-related communication
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'activity_inquiry' CHECK (message_type IN ('activity_inquiry', 'activity_update', 'general', 'support')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  thread_id UUID, -- Groups related messages together
  attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_activity_id ON messages(activity_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

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

-- Function to create a new message thread
CREATE OR REPLACE FUNCTION create_message_thread(
  activity_id_param UUID,
  sender_id_param UUID,
  receiver_id_param UUID,
  subject_param VARCHAR(255),
  content_param TEXT,
  message_type_param VARCHAR(20) DEFAULT 'activity_inquiry'
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
    message_type, thread_id
  ) VALUES (
    uuid_generate_v4(), activity_id_param, sender_id_param, receiver_id_param,
    subject_param, content_param, message_type_param, new_thread_id
  ) RETURNING id INTO new_message_id;

  -- Add participants to the thread
  INSERT INTO message_participants (thread_id, user_id, joined_at)
  VALUES
    (new_thread_id, sender_id_param, CURRENT_TIMESTAMP),
    (new_thread_id, receiver_id_param, CURRENT_TIMESTAMP);

  -- Create notification for receiver
  INSERT INTO notifications (
    user_id, type, title, content, data, priority
  ) VALUES (
    receiver_id_param,
    'new_message',
    '新消息: ' || subject_param,
    '您收到了一条关于活动的新消息',
    jsonb_build_object(
      'message_id', new_message_id,
      'thread_id', new_thread_id,
      'activity_id', activity_id_param,
      'sender_id', sender_id_param
    ),
    'medium'
  );

  RETURN new_thread_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reply to a message thread
CREATE OR REPLACE FUNCTION reply_to_message_thread(
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
  thread_subject VARCHAR(255);
BEGIN
  -- Get the activity_id and subject from the original thread
  SELECT activity_id, subject INTO activity_id_param, thread_subject
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
    message_type, thread_id, reply_to
  ) VALUES (
    uuid_generate_v4(), activity_id_param, sender_id_param, receiver_id_param,
    'Re: ' || thread_subject, content_param, 'activity_inquiry', thread_id_param, reply_to_param
  ) RETURNING id INTO new_message_id;

  -- Update last read time for sender
  UPDATE message_participants
  SET last_read_at = CURRENT_TIMESTAMP
  WHERE thread_id = thread_id_param AND user_id = sender_id_param;

  -- Create notification for receiver
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
      'sender_id', sender_id_param
    ),
    'medium'
  );

  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  thread_id_param UUID,
  user_id_param UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark all unread messages in this thread as read for this user
  UPDATE messages
  SET is_read = true,
      read_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE thread_id = thread_id_param
    AND receiver_id = user_id_param
    AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Update participant's last read time
  UPDATE message_participants
  SET last_read_at = CURRENT_TIMESTAMP
  WHERE thread_id = thread_id_param AND user_id = user_id_param;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM messages
  WHERE receiver_id = user_id_param
    AND is_read = false
    AND status = 'active';

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update thread_id for first message
CREATE OR REPLACE FUNCTION auto_set_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If thread_id is not set, use the message id as thread_id
  IF NEW.thread_id IS NULL THEN
    NEW.thread_id := NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_set_thread_id
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION auto_set_thread_id();