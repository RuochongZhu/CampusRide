/**
 * 发送更多测试消息
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  'https://jfgenxnqpuutgdnnngsl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2VueG5xcHV1dGdkbm5uZ3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNTc5NCwiZXhwIjoyMDcwNTExNzk0fQ.UCxqUWrAvghm1xbfi_CEosgE3u5G0XcH9pSMv6fA8sE'
);

async function main() {
  // 获取 demo 用户
  const { data: demoUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'demo@cornell.edu')
    .single();

  // 获取测试用户
  const { data: testers } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .in('email', ['tester1@cornell.edu', 'tester2@cornell.edu', 'tester3@cornell.edu']);

  if (!demoUser || !testers || testers.length === 0) {
    console.log('找不到用户');
    return;
  }

  // 在现有线程中发送更多消息
  const { data: existingThreads } = await supabase
    .from('messages')
    .select('thread_id, sender_id')
    .eq('receiver_id', demoUser.id)
    .in('sender_id', testers.map(t => t.id));

  const additionalMessages = [
    '还在吗？等你回复呢~',
    '价格可以商量吗？',
    '什么时候方便？'
  ];

  console.log('发送额外消息到现有线程...\n');

  for (let i = 0; i < testers.length && i < existingThreads.length; i++) {
    const tester = testers[i];
    const thread = existingThreads.find(t => t.sender_id === tester.id);

    if (thread) {
      const { error } = await supabase
        .from('messages')
        .insert({
          id: uuidv4(),
          sender_id: tester.id,
          receiver_id: demoUser.id,
          subject: `来自 ${tester.first_name} 的消息`,
          content: additionalMessages[i],
          message_type: 'general',
          thread_id: thread.thread_id,
          is_read: false,
          status: 'active',
          context_type: 'general'
        });

      if (!error) {
        console.log(`✓ ${tester.first_name}: "${additionalMessages[i]}"`);
      }
    }
  }

  // 统计未读消息
  const { data: unread } = await supabase
    .from('messages')
    .select('id')
    .eq('receiver_id', demoUser.id)
    .eq('is_read', false)
    .eq('status', 'active');

  console.log(`\ndemo@cornell.edu 现在有 ${unread?.length || 0} 条未读消息`);
}

main();
