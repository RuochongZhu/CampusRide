import { supabaseAdmin } from '../src/config/database.js';

/**
 * 测试评论功能的实际错误
 */
async function testCommentError() {
  console.log('🔍 Testing actual comment error...');

  const testItemId = '6bcca951-2e46-429e-ab14-f291589d790f'; // 从日志中获取的ID

  try {
    // 测试获取评论的完整错误
    console.log('📖 Testing getComments with exact controller logic...');

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
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })
      .range(0, 9);

    if (error) {
      console.error('❌ getComments database error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ getComments successful:', comments?.length || 0, 'comments');

      if (comments && comments.length > 0) {
        console.log('📝 Sample comment:', comments[0]);
      }
    }

    // 测试创建评论
    console.log('\n💬 Testing createComment...');

    const testUserId = '0d7cf564-1e6d-4772-a550-1bf607420269';

    const { data: newComment, error: createError } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: testItemId,
        user_id: testUserId,
        parent_comment_id: null,
        content: 'Test comment to debug error'
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
      console.error('❌ createComment database error:', createError);
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      });
    } else {
      console.log('✅ createComment successful:', newComment);

      // 清理测试评论
      await supabaseAdmin
        .from('marketplace_comments')
        .delete()
        .eq('id', newComment.id);
      console.log('🧹 Test comment cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎉 Error diagnosis completed!');
}

// 运行测试
testCommentError();