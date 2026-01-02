import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Complete SQL to create the messaging system
const SQL_STATEMENTS = [
  // Create conversations table
  `CREATE TABLE IF NOT EXISTS marketplace_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, buyer_id, seller_id)
  );`,

  // Create messages table
  `CREATE TABLE IF NOT EXISTS marketplace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
    message_type VARCHAR(20) DEFAULT 'reply' CHECK (message_type IN ('inquiry', 'reply', 'offer', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );`,

  // Add foreign keys after tables are created
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'marketplace_conversations_item_id_fkey'
    ) THEN
      ALTER TABLE marketplace_conversations
      ADD CONSTRAINT marketplace_conversations_item_id_fkey
      FOREIGN KEY (item_id) REFERENCES marketplace_items(id) ON DELETE CASCADE;
    END IF;
  END $$;`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'marketplace_conversations_buyer_id_fkey'
    ) THEN
      ALTER TABLE marketplace_conversations
      ADD CONSTRAINT marketplace_conversations_buyer_id_fkey
      FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END $$;`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'marketplace_conversations_seller_id_fkey'
    ) THEN
      ALTER TABLE marketplace_conversations
      ADD CONSTRAINT marketplace_conversations_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END $$;`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'marketplace_messages_conversation_id_fkey'
    ) THEN
      ALTER TABLE marketplace_messages
      ADD CONSTRAINT marketplace_messages_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES marketplace_conversations(id) ON DELETE CASCADE;
    END IF;
  END $$;`,

  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'marketplace_messages_sender_id_fkey'
    ) THEN
      ALTER TABLE marketplace_messages
      ADD CONSTRAINT marketplace_messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END $$;`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_item_id ON marketplace_conversations(item_id);`,
  `CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_buyer_id ON marketplace_conversations(buyer_id);`,
  `CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_seller_id ON marketplace_conversations(seller_id);`,
  `CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_status ON marketplace_conversations(status);`,
  `CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation_id ON marketplace_messages(conversation_id);`,
  `CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);`,
  `CREATE INDEX IF NOT EXISTS idx_marketplace_messages_created_at ON marketplace_messages(created_at DESC);`,

  // Enable RLS
  `ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;`,

  // Drop existing policies if they exist
  `DROP POLICY IF EXISTS "Users can view their conversations" ON marketplace_conversations;`,
  `DROP POLICY IF EXISTS "Users can create conversations as buyers" ON marketplace_conversations;`,
  `DROP POLICY IF EXISTS "Participants can update conversations" ON marketplace_conversations;`,
  `DROP POLICY IF EXISTS "Users can view messages in their conversations" ON marketplace_messages;`,
  `DROP POLICY IF EXISTS "Users can send messages in their conversations" ON marketplace_messages;`,
  `DROP POLICY IF EXISTS "Users can update messages" ON marketplace_messages;`,

  // Create RLS policies for conversations
  `CREATE POLICY "Users can view their conversations" ON marketplace_conversations
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);`,

  `CREATE POLICY "Users can create conversations as buyers" ON marketplace_conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id AND buyer_id != seller_id);`,

  `CREATE POLICY "Participants can update conversations" ON marketplace_conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);`,

  // Create RLS policies for messages
  `CREATE POLICY "Users can view messages in their conversations" ON marketplace_messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM marketplace_conversations c
        WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      )
    );`,

  `CREATE POLICY "Users can send messages in their conversations" ON marketplace_messages
    FOR INSERT WITH CHECK (
      auth.uid() = sender_id
      AND EXISTS (
        SELECT 1 FROM marketplace_conversations c
        WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      )
    );`,

  `CREATE POLICY "Users can update messages" ON marketplace_messages
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM marketplace_conversations c
        WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      )
    );`,

  // Create trigger functions
  `CREATE OR REPLACE FUNCTION update_marketplace_conversations_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;`,

  `DROP TRIGGER IF EXISTS trigger_marketplace_conversations_updated_at ON marketplace_conversations;`,

  `CREATE TRIGGER trigger_marketplace_conversations_updated_at
    BEFORE UPDATE ON marketplace_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_conversations_updated_at();`,

  `CREATE OR REPLACE FUNCTION update_conversation_stats()
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
  $$ LANGUAGE plpgsql;`,

  `DROP TRIGGER IF EXISTS trigger_conversation_stats ON marketplace_messages;`,

  `CREATE TRIGGER trigger_conversation_stats
    AFTER INSERT OR DELETE ON marketplace_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_stats();`,

  // Grant permissions
  `GRANT ALL ON marketplace_conversations TO authenticated;`,
  `GRANT ALL ON marketplace_messages TO authenticated;`
];

async function setupMessaging() {
  console.log('🚀 Setting up marketplace messaging system...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Combine all SQL statements
  const fullSQL = SQL_STATEMENTS.join('\n\n');

  console.log('📝 Preparing to create tables...');
  console.log('   Total SQL statements:', SQL_STATEMENTS.length);

  // Output SQL for manual execution
  console.log('\n📋 Please execute this SQL in Supabase SQL Editor:\n');
  console.log('='.repeat(80));
  console.log(fullSQL);
  console.log('='.repeat(80));

  console.log('\n📌 Steps:');
  console.log('   1. Open: https://supabase.com/dashboard/project/jfgenxnqpuutgdnnngsl/sql');
  console.log('   2. Create a new query');
  console.log('   3. Copy and paste the SQL above');
  console.log('   4. Click "Run" (or press Ctrl+Enter)');
  console.log('   5. Wait for "Success. No rows returned"\n');

  console.log('💡 Tip: You can also save this SQL as a file:');
  console.log('   The SQL is already in: database/migrations/006_marketplace_messages_schema.sql\n');

  // Verify if tables exist
  console.log('🔍 Checking current table status...');

  const { error: convError } = await supabase
    .from('marketplace_conversations')
    .select('id')
    .limit(1);

  const { error: msgError } = await supabase
    .from('marketplace_messages')
    .select('id')
    .limit(1);

  if (!convError && !msgError) {
    console.log('✅ Tables already exist!');
    console.log('   ✓ marketplace_conversations');
    console.log('   ✓ marketplace_messages\n');

    console.log('🎉 Marketplace messaging system is ready!');
    console.log('\n📱 API Endpoints Available:');
    console.log('   POST   /api/v1/marketplace/items/:itemId/message');
    console.log('   POST   /api/v1/marketplace/conversations/:conversationId/messages');
    console.log('   GET    /api/v1/marketplace/conversations');
    console.log('   GET    /api/v1/marketplace/conversations/:conversationId/messages');
    console.log('   GET    /api/v1/marketplace/conversations/unread-count\n');
  } else {
    console.log('⚠️  Tables not found yet');
    console.log('   After running the SQL above, run this script again to verify.\n');
  }
}

setupMessaging().catch(console.error);
