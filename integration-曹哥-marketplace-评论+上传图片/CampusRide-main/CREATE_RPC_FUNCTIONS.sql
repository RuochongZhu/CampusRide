-- =========================================
-- Create RPC Functions to Bypass PostgREST Cache
-- =========================================

-- Function to create or get existing conversation
CREATE OR REPLACE FUNCTION create_marketplace_conversation(
  p_item_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID
)
RETURNS TABLE (
  id UUID,
  item_id UUID,
  buyer_id UUID,
  seller_id UUID,
  status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to get existing conversation
  RETURN QUERY
  SELECT
    c.id,
    c.item_id,
    c.buyer_id,
    c.seller_id,
    c.status,
    c.created_at
  FROM marketplace_conversations c
  WHERE c.item_id = p_item_id
    AND c.buyer_id = p_buyer_id
    AND c.seller_id = p_seller_id
    AND c.status = 'active'
  LIMIT 1;

  -- If no existing conversation, create one
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO marketplace_conversations (item_id, buyer_id, seller_id, status)
    VALUES (p_item_id, p_buyer_id, p_seller_id, 'active')
    RETURNING
      marketplace_conversations.id,
      marketplace_conversations.item_id,
      marketplace_conversations.buyer_id,
      marketplace_conversations.seller_id,
      marketplace_conversations.status,
      marketplace_conversations.created_at;
  END IF;
END;
$$;

-- Function to create a message
CREATE OR REPLACE FUNCTION create_marketplace_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_message TEXT,
  p_message_type VARCHAR DEFAULT 'reply'
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  message TEXT,
  message_type VARCHAR,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO marketplace_messages (
    conversation_id,
    sender_id,
    message,
    message_type,
    is_read
  )
  VALUES (
    p_conversation_id,
    p_sender_id,
    p_message,
    p_message_type,
    FALSE
  )
  RETURNING
    marketplace_messages.id,
    marketplace_messages.conversation_id,
    marketplace_messages.sender_id,
    marketplace_messages.message,
    marketplace_messages.message_type,
    marketplace_messages.is_read,
    marketplace_messages.created_at;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_marketplace_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION create_marketplace_message TO authenticated;

-- =========================================
-- Setup Complete!
-- =========================================
-- Created:
--   ✓ create_marketplace_conversation() function
--   ✓ create_marketplace_message() function
-- These functions bypass PostgREST cache issues
-- =========================================
