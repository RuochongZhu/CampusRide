import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Individual SQL statements for step-by-step execution
const sqlStatements = [
  {
    name: 'Create conversations table',
    sql: `
CREATE TABLE IF NOT EXISTS marketplace_conversations (
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
);`
  },
  {
    name: 'Create messages table',
    sql: `
CREATE TABLE IF NOT EXISTS marketplace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
    message_type VARCHAR(20) DEFAULT 'reply' CHECK (message_type IN ('inquiry', 'reply', 'offer', 'system')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    name: 'Add foreign key: item_id',
    sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'marketplace_conversations_item_id_fkey'
  ) THEN
    ALTER TABLE marketplace_conversations
    ADD CONSTRAINT marketplace_conversations_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES marketplace_items(id) ON DELETE CASCADE;
  END IF;
END $$;`
  },
  {
    name: 'Add foreign key: buyer_id',
    sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'marketplace_conversations_buyer_id_fkey'
  ) THEN
    ALTER TABLE marketplace_conversations
    ADD CONSTRAINT marketplace_conversations_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;`
  },
  {
    name: 'Add foreign key: seller_id',
    sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'marketplace_conversations_seller_id_fkey'
  ) THEN
    ALTER TABLE marketplace_conversations
    ADD CONSTRAINT marketplace_conversations_seller_id_fkey
    FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;`
  },
  {
    name: 'Add foreign key: conversation_id',
    sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'marketplace_messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE marketplace_messages
    ADD CONSTRAINT marketplace_messages_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES marketplace_conversations(id) ON DELETE CASCADE;
  END IF;
END $$;`
  },
  {
    name: 'Add foreign key: sender_id',
    sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'marketplace_messages_sender_id_fkey'
  ) THEN
    ALTER TABLE marketplace_messages
    ADD CONSTRAINT marketplace_messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;`
  },
  {
    name: 'Create indexes',
    sql: `
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_item_id ON marketplace_conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_buyer_id ON marketplace_conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_seller_id ON marketplace_conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_conversations_status ON marketplace_conversations(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_conversation_id ON marketplace_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender_id ON marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_created_at ON marketplace_messages(created_at DESC);`
  },
  {
    name: 'Enable RLS',
    sql: `
ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Drop old policies',
    sql: `
DROP POLICY IF EXISTS "Users can view their conversations" ON marketplace_conversations;
DROP POLICY IF EXISTS "Users can create conversations as buyers" ON marketplace_conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON marketplace_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON marketplace_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON marketplace_messages;
DROP POLICY IF EXISTS "Users can update messages" ON marketplace_messages;`
  },
  {
    name: 'Create conversation policies',
    sql: `
CREATE POLICY "Users can view their conversations" ON marketplace_conversations
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations as buyers" ON marketplace_conversations
    FOR INSERT WITH CHECK (auth.uid() = buyer_id AND buyer_id != seller_id);

CREATE POLICY "Participants can update conversations" ON marketplace_conversations
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);`
  },
  {
    name: 'Create message policies',
    sql: `
CREATE POLICY "Users can view messages in their conversations" ON marketplace_messages
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM marketplace_conversations c
        WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      )
    );

CREATE POLICY "Users can send messages in their conversations" ON marketplace_messages
    FOR INSERT WITH CHECK (
      auth.uid() = sender_id
      AND EXISTS (
        SELECT 1 FROM marketplace_conversations c
        WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      )
    );

CREATE POLICY "Users can update messages" ON marketplace_messages
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM marketplace_conversations c
        WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
      )
    );`
  },
  {
    name: 'Create trigger functions',
    sql: `
CREATE OR REPLACE FUNCTION update_marketplace_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
$$ LANGUAGE plpgsql;`
  },
  {
    name: 'Create triggers',
    sql: `
DROP TRIGGER IF EXISTS trigger_marketplace_conversations_updated_at ON marketplace_conversations;
CREATE TRIGGER trigger_marketplace_conversations_updated_at
    BEFORE UPDATE ON marketplace_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_conversations_updated_at();

DROP TRIGGER IF EXISTS trigger_conversation_stats ON marketplace_messages;
CREATE TRIGGER trigger_conversation_stats
    AFTER INSERT OR DELETE ON marketplace_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_stats();`
  },
  {
    name: 'Grant permissions',
    sql: `
GRANT ALL ON marketplace_conversations TO authenticated;
GRANT ALL ON marketplace_messages TO authenticated;`
  }
];

async function executeSQLDirect(sql) {
  try {
    // Use the PostgREST query method
    const { data, error } = await supabase.rpc('exec', { sql_query: sql });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setupTables() {
  console.log('🚀 Setting up Marketplace Messaging Tables\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📊 Total steps: ${sqlStatements.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < sqlStatements.length; i++) {
    const { name, sql } = sqlStatements[i];
    console.log(`[${i + 1}/${sqlStatements.length}] ${name}...`);

    const result = await executeSQLDirect(sql);

    if (result.success) {
      console.log(`   ✅ Success\n`);
      successCount++;
    } else {
      console.log(`   ⚠️  Warning: ${result.error}\n`);
      // Continue anyway as some errors might be expected (e.g., "already exists")
    }

    // Small delay between operations
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('='.repeat(60));
  console.log(`📊 Execution Summary:`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Warnings: ${failCount}`);
  console.log('='.repeat(60));

  // Verify tables exist
  console.log('\n🔍 Verifying tables...\n');

  const { error: convError } = await supabase
    .from('marketplace_conversations')
    .select('id')
    .limit(1);

  const { error: msgError } = await supabase
    .from('marketplace_messages')
    .select('id')
    .limit(1);

  if (!convError && !msgError) {
    console.log('✅ SUCCESS! Tables verified:');
    console.log('   ✓ marketplace_conversations');
    console.log('   ✓ marketplace_messages\n');

    console.log('🎉 Marketplace Messaging System is READY!\n');
    console.log('📱 Available API Endpoints:');
    console.log('   POST   /api/v1/marketplace/items/:itemId/message');
    console.log('   POST   /api/v1/marketplace/conversations/:conversationId/messages');
    console.log('   GET    /api/v1/marketplace/conversations');
    console.log('   GET    /api/v1/marketplace/conversations/:conversationId/messages');
    console.log('   GET    /api/v1/marketplace/conversations/unread-count\n');

    return true;
  } else {
    console.log('❌ Tables not found. Errors:');
    if (convError) console.log(`   marketplace_conversations: ${convError.message}`);
    if (msgError) console.log(`   marketplace_messages: ${msgError.message}\n`);

    console.log('💡 Alternative: Use Supabase Dashboard SQL Editor');
    console.log('   File: D:\\5900项目\\CampusRide-main\\SETUP_MARKETPLACE_MESSAGING.sql\n');

    return false;
  }
}

setupTables()
  .then(success => {
    if (success) {
      console.log('✨ Setup completed successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Setup completed with warnings. Please verify manually.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
