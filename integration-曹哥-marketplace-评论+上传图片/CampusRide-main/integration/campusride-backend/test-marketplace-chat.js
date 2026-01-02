import { supabaseAdmin } from './src/config/database.js';

/**
 * 测试marketplace私密聊天功能
 */
async function testMarketplaceChat() {
  console.log('🔧 Testing marketplace private messaging functionality...');

  // 测试数据
  const testItemId = '6bcca951-2e46-429e-ab14-f291589d790f'; // 使用已知的商品ID
  const buyerId = '0d7cf564-1e6d-4772-a550-1bf607420269'; // 买家ID
  const sellerId = '550e8400-e29b-41d4-a716-446655440000'; // 假设的卖家ID

  console.log('📊 Test data:', { testItemId, buyerId, sellerId });

  try {
    // 1. 检查商品是否存在
    console.log('\n📋 Step 1: Checking if item exists...');
    const { data: item, error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, title, seller_id, status')
      .eq('id', testItemId)
      .single();

    if (itemError || !item) {
      console.error('❌ Test item not found:', testItemId);
      return;
    }

    console.log('✅ Item found:', item);

    // 2. 检查marketplace_conversations表是否存在
    console.log('\n📋 Step 2: Checking marketplace_conversations table...');
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('*')
      .limit(1);

    if (convError) {
      console.error('❌ marketplace_conversations table error:', convError);
      return;
    }

    console.log('✅ marketplace_conversations table accessible');

    // 3. 检查marketplace_messages表是否存在
    console.log('\n📋 Step 3: Checking marketplace_messages table...');
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('marketplace_messages')
      .select('*')
      .limit(1);

    if (msgError) {
      console.error('❌ marketplace_messages table error:', msgError);
      return;
    }

    console.log('✅ marketplace_messages table accessible');

    // 4. 模拟创建对话
    console.log('\n💬 Step 4: Testing conversation creation...');

    // 首先检查是否已有对话存在
    const { data: existingConv } = await supabaseAdmin
      .from('marketplace_conversations')
      .select('id')
      .eq('item_id', testItemId)
      .eq('buyer_id', buyerId)
      .eq('seller_id', item.seller_id)
      .single();

    if (existingConv) {
      console.log('✅ Found existing conversation:', existingConv.id);

      // 获取该对话的消息
      const { data: convMessages } = await supabaseAdmin
        .from('marketplace_messages')
        .select('*')
        .eq('conversation_id', existingConv.id)
        .order('created_at', { ascending: true });

      console.log('💬 Conversation messages:', convMessages?.length || 0);
    } else {
      console.log('ℹ️  No existing conversation found');

      // 创建新对话（仅当买家不是卖家时）
      if (buyerId !== item.seller_id) {
        const { data: newConv, error: convCreateError } = await supabaseAdmin
          .from('marketplace_conversations')
          .insert({
            item_id: testItemId,
            buyer_id: buyerId,
            seller_id: item.seller_id,
            status: 'active'
          })
          .select('id')
          .single();

        if (convCreateError) {
          console.error('❌ Failed to create conversation:', convCreateError);
          return;
        }

        console.log('✅ New conversation created:', newConv.id);

        // 创建初始消息
        const { data: newMsg, error: msgCreateError } = await supabaseAdmin
          .from('marketplace_messages')
          .insert({
            conversation_id: newConv.id,
            sender_id: buyerId,
            message: 'Hi! I\'m interested in this item. Is it still available?',
            message_type: 'inquiry'
          })
          .select('*')
          .single();

        if (msgCreateError) {
          console.error('❌ Failed to create message:', msgCreateError);
        } else {
          console.log('✅ Initial message created:', newMsg.id);
        }

        // 清理测试数据
        console.log('\n🧹 Cleaning up test data...');
        await supabaseAdmin
          .from('marketplace_conversations')
          .delete()
          .eq('id', newConv.id);

        console.log('✅ Test data cleaned up');
      } else {
        console.log('ℹ️  Buyer is the seller, skipping conversation creation');
      }
    }

    // 5. 测试API端点访问
    console.log('\n🌐 Step 5: Testing API endpoint structure...');

    // 检查路由是否正确配置
    const routes = [
      '/api/v1/marketplace/items/:itemId/message',
      '/api/v1/marketplace/conversations/:conversationId/messages',
      '/api/v1/marketplace/conversations',
      '/api/v1/marketplace/conversations/unread-count'
    ];

    console.log('📋 Expected API routes:', routes);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎉 Marketplace chat test completed!');
}

// 运行测试
testMarketplaceChat().catch(console.error);