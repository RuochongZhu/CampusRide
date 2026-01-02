import { supabaseAdmin } from './src/config/database.js';

/**
 * 直接创建marketplace消息表
 */
async function createMarketplaceTables() {
  console.log('🔧 Creating marketplace messaging tables directly...');

  try {
    // 1. 创建conversations表
    console.log('📋 Step 1: Creating marketplace_conversations table...');

    const createConversationsTable = `
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
      );
    `;

    const { error: convError } = await supabaseAdmin.rpc('exec_sql', {
      query: createConversationsTable
    });

    if (convError) {
      console.log('⚠️  RPC failed, trying direct creation...');

      // 尝试另一种方法，使用原始查询
      const { error: directError } = await supabaseAdmin
        .from('marketplace_conversations')
        .select('id')
        .limit(0);

      if (directError) {
        console.error('❌ Failed to create conversations table:', directError);
      }
    } else {
      console.log('✅ Conversations table created successfully');
    }

    // 2. 创建messages表
    console.log('📋 Step 2: Creating marketplace_messages table...');

    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS marketplace_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL,
        sender_id UUID NOT NULL,
        message TEXT NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
        message_type VARCHAR(20) DEFAULT 'reply' CHECK (message_type IN ('inquiry', 'reply', 'offer', 'system')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const { error: msgError } = await supabaseAdmin.rpc('exec_sql', {
      query: createMessagesTable
    });

    if (msgError) {
      console.log('⚠️  RPC failed, trying direct access...');

      const { error: directError } = await supabaseAdmin
        .from('marketplace_messages')
        .select('id')
        .limit(0);

      if (directError) {
        console.error('❌ Failed to create messages table:', directError);
      }
    } else {
      console.log('✅ Messages table created successfully');
    }

    // 3. 测试表访问
    console.log('📋 Step 3: Testing table access...');

    // 测试conversations表
    const { data: convData, error: convTestError } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('*')
      .limit(1);

    if (convTestError) {
      console.error('❌ Cannot access marketplace_conversations:', convTestError);
    } else {
      console.log('✅ marketplace_conversations table accessible');
    }

    // 测试messages表
    const { data: msgData, error: msgTestError } = await supabaseAdmin
      .from('marketplace_messages')
      .select('*')
      .limit(1);

    if (msgTestError) {
      console.error('❌ Cannot access marketplace_messages:', msgTestError);
    } else {
      console.log('✅ marketplace_messages table accessible');
    }

    // 4. 检查现有表列表
    console.log('📋 Step 4: Checking existing tables...');

    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%marketplace%');

    if (!tablesError && tables) {
      console.log('📋 Existing marketplace tables:', tables.map(t => t.table_name));
    }

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }

  console.log('\n🎉 Table creation attempt completed!');
}

// 运行创建
createMarketplaceTables().catch(console.error);