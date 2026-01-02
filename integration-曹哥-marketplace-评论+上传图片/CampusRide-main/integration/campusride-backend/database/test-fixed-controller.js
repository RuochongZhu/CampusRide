import { supabaseAdmin } from '../src/config/database.js';

/**
 * 测试新修复的评论控制器逻辑
 */
async function testFixedCommentController() {
  console.log('🧪 Testing fixed comment controller logic...');

  const testItemId = '6bcca951-2e46-429e-ab14-f291589d790f'; // 使用错误日志中的itemId
  const testUserId = '0d7cf564-1e6d-4772-a550-1bf607420269';

  try {
    // 测试1: 尝试使用新的查询结构获取评论
    console.log('📖 Testing getComments query...');

    const { data: comments, error } = await supabaseAdmin
      .from('marketplace_comments')
      .select(`
        id,
        item_id,
        user_id,
        parent_comment_id,
        content,
        likes_count,
        created_at,
        updated_at,
        users:user_id (
          id,
          student_id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('item_id', testItemId)
      .is('parent_comment_id', null);

    if (error) {
      console.error('❌ getComments query failed:', error);
    } else {
      console.log('✅ getComments query successful:', comments?.length || 0, 'comments');
    }

    // 测试2: 尝试创建评论
    console.log('\n💬 Testing createComment...');

    const { data: newComment, error: createError } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: testItemId,
        user_id: testUserId,
        parent_comment_id: null,
        content: 'Test comment from fixed controller'
      })
      .select(`
        id,
        item_id,
        user_id,
        parent_comment_id,
        content,
        likes_count,
        created_at,
        updated_at,
        users:user_id (
          id,
          student_id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error('❌ createComment failed:', createError);
    } else {
      console.log('✅ createComment successful:', newComment);

      // 清理：删除测试评论
      console.log('\n🧹 Cleaning up...');
      await supabaseAdmin
        .from('marketplace_comments')
        .delete()
        .eq('id', newComment.id);
      console.log('✅ Test comment cleaned up');
    }

    // 测试3: 验证商品是否存在
    console.log('\n🏪 Testing item existence...');

    const { data: item, error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, seller_id')
      .eq('id', testItemId)
      .single();

    if (itemError) {
      console.error('❌ Item not found:', itemError);
    } else {
      console.log('✅ Item exists:', item);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎉 Controller test completed!');
}

// 运行测试
testFixedCommentController();