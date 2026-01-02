import { supabaseAdmin } from '../src/config/database.js';

/**
 * 测试评论表结构和基本功能
 */
async function testCommentsTable() {
  console.log('🔧 Testing marketplace_comments table...');

  try {
    // 1. 测试表是否存在并检查结构
    console.log('📋 Step 1: Checking table structure...');
    const { data: testQuery, error: testError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error accessing marketplace_comments table:', testError);
      return;
    }

    console.log('✅ Table accessible, sample record:', testQuery?.[0] || 'No records found');

    // 2. 检查必要的列是否存在
    console.log('\n📋 Step 2: Checking required columns...');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('marketplace_comments')
      .select(`
        id,
        item_id,
        user_id,
        parent_id,
        content,
        images,
        is_edited,
        likes_count,
        replies_count,
        created_at,
        updated_at
      `)
      .limit(1);

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
    } else {
      console.log('✅ All required columns exist');
    }

    // 3. 检查是否有marketplace_items数据
    console.log('\n📋 Step 3: Checking marketplace_items...');
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, title')
      .limit(3);

    if (itemsError) {
      console.error('❌ Error accessing marketplace_items:', itemsError);
    } else {
      console.log('✅ Marketplace items found:', items?.length || 0);
      if (items?.length > 0) {
        console.log('   Sample items:', items.map(item => `${item.id}: ${item.title}`));
      }
    }

    // 4. 检查用户表
    console.log('\n📋 Step 4: Checking users table...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')
      .limit(3);

    if (usersError) {
      console.error('❌ Error accessing users table:', usersError);
    } else {
      console.log('✅ Users found:', users?.length || 0);
    }

    // 5. 检查评论点赞表
    console.log('\n📋 Step 5: Checking comment_likes table...');
    const { data: likes, error: likesError } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .select('*')
      .limit(1);

    if (likesError) {
      console.error('❌ Error accessing marketplace_comment_likes table:', likesError);
    } else {
      console.log('✅ Comment likes table accessible');
    }

    console.log('\n🎉 Table structure test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// 运行测试
testCommentsTable();