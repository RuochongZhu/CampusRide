import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('🚀 Creating marketplace messaging tables...\n');

  try {
    // Test if tables already exist
    console.log('📊 Checking if tables exist...');

    const { data: convData, error: convError } = await supabase
      .from('marketplace_conversations')
      .select('id')
      .limit(1);

    const { data: msgData, error: msgError } = await supabase
      .from('marketplace_messages')
      .select('id')
      .limit(1);

    if (!convError && !msgError) {
      console.log('✅ Tables already exist!');
      console.log('   - marketplace_conversations: ✓');
      console.log('   - marketplace_messages: ✓');
      return;
    }

    console.log('\n⚠️  Tables not found or need to be created');
    console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
    console.log('=' .repeat(80));
    console.log(`
-- Marketplace Private Messaging System

-- Marketplace conversations table
CREATE TABLE IF NOT EXISTS marketplace_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, buyer_id, seller_id)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_item_id ON marketplace_conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_buyer_id ON marketplace_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_seller_id ON marketplace_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation_id ON marketplace_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_created_at ON marketplace_messages(created_at DESC);

-- Enable RLS
ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON marketplace_conversations;
CREATE POLICY "Users can view their conversations" ON marketplace_conversations
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Users can create conversations as buyers" ON marketplace_conversations;
CREATE POLICY "Users can create conversations as buyers" ON marketplace_conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id AND buyer_id != seller_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON marketplace_conversations;
CREATE POLICY "Participants can update conversations" ON marketplace_conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON marketplace_messages;
CREATE POLICY "Users can view messages in their conversations" ON marketplace_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM marketplace_conversations c
            WHERE c.id = marketplace_messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON marketplace_messages;
CREATE POLICY "Users can send messages in their conversations" ON marketplace_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM marketplace_conversations c
            WHERE c.id = marketplace_messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update messages" ON marketplace_messages;
CREATE POLICY "Users can update messages" ON marketplace_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM marketplace_conversations c
            WHERE c.id = marketplace_messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

-- Trigger functions
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

CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE marketplace_conversations
        SET message_count = message_count + 1,
            last_message_at = NEW.created_at,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE marketplace_conversations
        SET message_count = GREATEST(0, message_count - 1),
            updated_at = CURRENT_TIMESTAMP
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

-- Grant permissions
GRANT ALL ON marketplace_conversations TO authenticated;
GRANT ALL ON marketplace_messages TO authenticated;
    `);
    console.log('=' .repeat(80));
    console.log('\n📌 Steps:');
    console.log('   1. Open your Supabase project dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy and paste the SQL above');
    console.log('   4. Click "Run"');
    console.log('   5. Verify tables are created\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTables();
