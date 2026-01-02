-- Marketplace Private Messaging System Migration
-- Create tables for private conversations between buyers and sellers

-- Marketplace conversations table
CREATE TABLE IF NOT EXISTS marketplace_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, buyer_id, seller_id) -- One conversation per item-buyer-seller combination
);

-- Marketplace messages table
CREATE TABLE IF NOT EXISTS marketplace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES marketplace_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
    message_type VARCHAR(20) DEFAULT 'reply' CHECK (message_type IN ('inquiry', 'reply', 'offer', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_item_id ON marketplace_conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_buyer_id ON marketplace_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_seller_id ON marketplace_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_status ON marketplace_conversations(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_created_at ON marketplace_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation_id ON marketplace_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_is_read ON marketplace_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_created_at ON marketplace_messages(created_at DESC);

-- Add message count to conversations (denormalized for performance)
ALTER TABLE marketplace_conversations ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE marketplace_conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Trigger to update updated_at timestamp for conversations
CREATE OR REPLACE FUNCTION update_marketplace_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_conversations_updated_at ON marketplace_conversations;
CREATE TRIGGER trigger_marketplace_conversations_updated_at
    BEFORE UPDATE ON marketplace_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_conversations_updated_at();

-- Trigger to update updated_at timestamp for messages
CREATE OR REPLACE FUNCTION update_marketplace_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_messages_updated_at ON marketplace_messages;
CREATE TRIGGER trigger_marketplace_messages_updated_at
    BEFORE UPDATE ON marketplace_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_messages_updated_at();

-- Function to update conversation message count and last message time
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE marketplace_conversations
        SET
            message_count = message_count + 1,
            last_message_at = NEW.created_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_conversations
        SET
            message_count = message_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.conversation_id;

        -- Update last_message_at to the most recent remaining message
        UPDATE marketplace_conversations
        SET last_message_at = (
            SELECT created_at
            FROM marketplace_messages
            WHERE conversation_id = OLD.conversation_id
            ORDER BY created_at DESC
            LIMIT 1
        )
        WHERE id = OLD.conversation_id;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_conversation_stats ON marketplace_messages;
CREATE TRIGGER trigger_conversation_stats
    AFTER INSERT OR DELETE ON marketplace_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_stats();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS policies
CREATE POLICY "marketplace_conversations_select" ON marketplace_conversations
    FOR SELECT USING (
        -- Users can see conversations they are part of
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

CREATE POLICY "marketplace_conversations_insert" ON marketplace_conversations
    FOR INSERT WITH CHECK (
        -- Users can only create conversations as buyers
        auth.uid() = buyer_id
        AND
        -- Can only create conversations for active items
        EXISTS (
            SELECT 1 FROM marketplace_items
            WHERE id = marketplace_conversations.item_id
            AND status = 'active'
        )
        AND
        -- Cannot create conversation with yourself (buyer != seller)
        buyer_id != seller_id
    );

CREATE POLICY "marketplace_conversations_update" ON marketplace_conversations
    FOR UPDATE USING (
        -- Participants can update conversations (e.g., close them)
        auth.uid() = buyer_id OR auth.uid() = seller_id
    ) WITH CHECK (
        -- Ensure participants don't change core fields
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Messages RLS policies
CREATE POLICY "marketplace_messages_select" ON marketplace_messages
    FOR SELECT USING (
        -- Users can see messages in conversations they are part of
        EXISTS (
            SELECT 1 FROM marketplace_conversations c
            WHERE c.id = marketplace_messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

CREATE POLICY "marketplace_messages_insert" ON marketplace_messages
    FOR INSERT WITH CHECK (
        -- Users can only send messages with their own sender_id
        auth.uid() = sender_id
        AND
        -- Can only send messages in conversations they are part of
        EXISTS (
            SELECT 1 FROM marketplace_conversations c
            WHERE c.id = marketplace_messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
            AND c.status = 'active'
        )
    );

CREATE POLICY "marketplace_messages_update" ON marketplace_messages
    FOR UPDATE USING (
        -- Users can update their own messages (e.g., mark as read)
        auth.uid() = sender_id
        OR
        -- Users can mark messages as read in their conversations
        EXISTS (
            SELECT 1 FROM marketplace_conversations c
            WHERE c.id = marketplace_messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    ) WITH CHECK (
        -- Ensure users don't change core fields inappropriately
        auth.uid() = sender_id
        OR
        -- Allow marking messages as read
        EXISTS (
            SELECT 1 FROM marketplace_conversations c
            WHERE c.id = marketplace_messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

-- Grant necessary permissions
GRANT ALL ON marketplace_conversations TO authenticated;
GRANT ALL ON marketplace_messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create some test data (optional)
-- Uncomment the lines below to create test conversations

-- INSERT INTO marketplace_conversations (item_id, buyer_id, seller_id)
-- SELECT
--     i.id as item_id,
--     u1.id as buyer_id,
--     i.seller_id as seller_id
-- FROM marketplace_items i
-- JOIN auth.users u1 ON u1.id != i.seller_id
-- WHERE i.status = 'active'
-- LIMIT 2;

-- INSERT INTO marketplace_messages (conversation_id, sender_id, message, message_type)
-- SELECT
--     c.id as conversation_id,
--     c.buyer_id as sender_id,
--     'Hi, I''m interested in this item. Is it still available?' as message,
--     'inquiry' as message_type
-- FROM marketplace_conversations c
-- LIMIT 2;