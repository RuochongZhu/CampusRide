/**
 * 测试消息通知功能
 * 创建测试用户并给 demo@cornell.edu 发送消息
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Supabase 配置
const SUPABASE_URL = 'https://jfgenxnqpuutgdnnngsl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZ2VueG5xcHV1dGdkbm5uZ3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzNTc5NCwiZXhwIjoyMDcwNTExNzk0fQ.UCxqUWrAvghm1xbfi_CEosgE3u5G0XcH9pSMv6fA8sE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 测试用户数据
const testUsers = [
  {
    email: 'tester1@cornell.edu',
    first_name: 'Alice',
    last_name: 'Wang',
    student_id: 'aw' + Date.now() + '1'
  },
  {
    email: 'tester2@cornell.edu',
    first_name: 'Bob',
    last_name: 'Chen',
    student_id: 'bc' + Date.now() + '2'
  },
  {
    email: 'tester3@cornell.edu',
    first_name: 'Carol',
    last_name: 'Liu',
    student_id: 'cl' + Date.now() + '3'
  }
];

// 测试消息内容
const testMessages = [
  '你好！我想问一下关于拼车的事情。',
  '请问明天有去纽约的车吗？',
  '我看到你发布的活动，想了解更多信息。'
];

async function main() {
  try {
    console.log('=== 开始测试消息通知功能 ===\n');

    // 1. 查找 demo@cornell.edu 用户
    console.log('1. 查找 demo@cornell.edu 用户...');
    const { data: demoUser, error: demoError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('email', 'demo@cornell.edu')
      .single();

    if (demoError || !demoUser) {
      console.error('找不到 demo@cornell.edu 用户:', demoError);
      console.log('\n尝试查找所有用户...');

      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .limit(10);

      if (allUsers && allUsers.length > 0) {
        console.log('现有用户列表:');
        allUsers.forEach(u => console.log(`  - ${u.email} (${u.first_name} ${u.last_name})`));
      }
      return;
    }

    console.log(`   找到用户: ${demoUser.first_name} ${demoUser.last_name} (${demoUser.email})`);
    console.log(`   用户 ID: ${demoUser.id}\n`);

    // 2. 创建或获取测试用户
    console.log('2. 创建/获取测试用户...');
    const createdUsers = [];
    const passwordHash = await bcrypt.hash('test1234', 10);

    for (const userData of testUsers) {
      // 先检查用户是否存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.log(`   用户已存在: ${existingUser.email}`);
        createdUsers.push(existingUser);
      } else {
        // 创建新用户 - 使用正确的字段
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: uuidv4(),
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            student_id: userData.student_id,
            password_hash: passwordHash,
            university: 'Cornell University',
            is_verified: true,
            verification_status: 'verified',
            points: 0,
            role: 'user'
          })
          .select()
          .single();

        if (createError) {
          console.error(`   创建用户失败 ${userData.email}:`, createError.message);
        } else {
          console.log(`   创建用户成功: ${newUser.email}`);
          createdUsers.push(newUser);
        }
      }
    }

    console.log(`\n   共有 ${createdUsers.length} 个测试用户准备发送消息\n`);

    // 3. 发送测试消息
    console.log('3. 发送测试消息...');

    for (let i = 0; i < createdUsers.length; i++) {
      const sender = createdUsers[i];
      const messageContent = testMessages[i] || `测试消息 ${i + 1}`;
      const threadId = uuidv4();
      const messageId = uuidv4();

      // 创建消息线程 - 直接插入消息
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .insert({
          id: messageId,
          sender_id: sender.id,
          receiver_id: demoUser.id,
          subject: `来自 ${sender.first_name} 的消息`,
          content: messageContent,
          message_type: 'general',
          thread_id: threadId,
          is_read: false,
          status: 'active',
          context_type: 'general'
        })
        .select()
        .single();

      if (msgError) {
        console.error(`   发送消息失败 (${sender.email}):`, msgError.message);
        continue;
      }

      console.log(`   ✓ ${sender.first_name} ${sender.last_name} -> demo@cornell.edu`);
      console.log(`     消息: "${messageContent}"`);
      console.log(`     Thread ID: ${threadId}\n`);

      // 添加消息参与者
      await supabase
        .from('message_participants')
        .insert([
          { thread_id: threadId, user_id: sender.id, status: 'active' },
          { thread_id: threadId, user_id: demoUser.id, status: 'active' }
        ]);

      // 为了绕过回复限制，添加一条来自接收者的"回复"消息
      // 这样发送者就可以继续发送更多消息
      const replyId = uuidv4();
      await supabase
        .from('messages')
        .insert({
          id: replyId,
          sender_id: demoUser.id,  // demo 用户作为发送者
          receiver_id: sender.id,
          subject: `Re: 来自 ${sender.first_name} 的消息`,
          content: '好的，收到了！',  // 自动回复
          message_type: 'general',
          thread_id: threadId,
          reply_to: messageId,
          is_read: true,  // 标记为已读
          status: 'active',
          context_type: 'general'
        });

      console.log(`     (已添加自动回复以解锁消息限制)\n`);
    }

    // 4. 验证未读消息数量
    console.log('4. 验证未读消息数量...');
    const { data: unreadMessages, error: countError } = await supabase
      .from('messages')
      .select('id, content, sender_id, is_read')
      .eq('receiver_id', demoUser.id)
      .eq('is_read', false)
      .eq('status', 'active');

    if (countError) {
      console.error('   查询未读消息失败:', countError.message);
    } else {
      console.log(`   demo@cornell.edu 有 ${unreadMessages?.length || 0} 条未读消息\n`);
    }

    // 5. 显示所有消息线程
    console.log('5. 显示 demo@cornell.edu 的消息线程...');
    const { data: threads, error: threadError } = await supabase
      .from('messages')
      .select(`
        thread_id,
        subject,
        content,
        is_read,
        created_at,
        sender:sender_id (first_name, last_name, email)
      `)
      .eq('receiver_id', demoUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (threads && threads.length > 0) {
      threads.forEach(t => {
        const readStatus = t.is_read ? '已读' : '未读';
        console.log(`   [${readStatus}] ${t.sender?.first_name} ${t.sender?.last_name}: ${t.content.substring(0, 30)}...`);
      });
    }

    console.log('\n=== 测试完成 ===');
    console.log('现在可以登录 demo@cornell.edu (密码: demo1234) 查看消息通知');

  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

main();
