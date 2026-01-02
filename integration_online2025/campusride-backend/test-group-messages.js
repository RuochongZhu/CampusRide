import { supabaseAdmin } from './src/config/database.js';

async function testGroupMessages() {
  console.log('🧪 Testing group messages directly from database...');

  try {
    // Get a sample group message
    const { data: messages, error } = await supabaseAdmin
      .from('group_messages')
      .select(`
        *,
        sender:users!sender_id(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .limit(5);

    if (error) {
      console.log('❌ Error:', error);
      return;
    }

    console.log('📋 Group messages found:', messages.length);

    messages.forEach((message, index) => {
      console.log(`\n📝 Message ${index + 1}:`);
      console.log(`  ID: ${message.id}`);
      console.log(`  Content: ${message.content}`);
      console.log(`  Sender ID: ${message.sender_id}`);
      console.log(`  Sender info:`, message.sender);
      console.log(`  Created: ${message.created_at}`);
    });

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testGroupMessages();