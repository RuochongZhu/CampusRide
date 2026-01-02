import { supabaseAdmin } from '../src/config/database.js';

/**
 * 测试评论的基本创建和读取功能
 */
async function testCommentBasicFunctions() {
  console.log('🔧 Testing comment basic functions...');

  try {
    // 测试1: 尝试直接创建一个评论
    console.log('📝 Step 1: Testing comment creation...');

    const testItemId = '763d8da2-1ad7-4e2e-ba6d-90f4836785e5'; // 使用已知存在的商品ID
    const testUserId = '0d7cf564-1e6d-4772-a550-1bf607420269'; // 使用已知存在的用户ID

    const { data: insertedComment, error: insertError } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: testItemId,
        user_id: testUserId,
        content: 'Test comment created by script'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Comment creation failed:', insertError);
    } else {
      console.log('✅ Comment created successfully:', insertedComment);

      // 测试2: 尝试读取刚创建的评论
      console.log('\n📖 Step 2: Testing comment reading...');

      const { data: fetchedComments, error: fetchError } = await supabaseAdmin
        .from('marketplace_comments')
        .select(`
          id,
          item_id,
          user_id,
          content,
          likes_count,
          created_at,
          updated_at
        `)
        .eq('item_id', testItemId);

      if (fetchError) {
        console.error('❌ Comment fetching failed:', fetchError);
      } else {
        console.log('✅ Comments fetched successfully:', fetchedComments);
      }

      // 测试3: 尝试读取评论的用户信息
      console.log('\n👤 Step 3: Testing comment with user info...');

      const { data: commentsWithUsers, error: joinError } = await supabaseAdmin
        .from('marketplace_comments')
        .select(`
          id,
          item_id,
          user_id,
          content,
          likes_count,
          created_at,
          updated_at,
          users:user_id (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('item_id', testItemId);

      if (joinError) {
        console.error('❌ Comment with user join failed:', joinError);
      } else {
        console.log('✅ Comments with users fetched successfully:', commentsWithUsers);
      }

      // 清理：删除测试评论
      console.log('\n🧹 Cleanup: Deleting test comment...');
      const { error: deleteError } = await supabaseAdmin
        .from('marketplace_comments')
        .delete()
        .eq('id', insertedComment.id);

      if (deleteError) {
        console.error('⚠️ Cleanup failed:', deleteError);
      } else {
        console.log('✅ Test comment deleted successfully');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎉 Test completed!');
}

// 运行测试
testCommentBasicFunctions();