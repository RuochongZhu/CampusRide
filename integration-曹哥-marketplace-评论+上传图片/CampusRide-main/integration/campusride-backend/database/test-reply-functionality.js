import { supabaseAdmin } from '../src/config/database.js';

/**
 * 测试评论回复功能
 */
async function testCommentReplies() {
  console.log('💬 Testing comment reply functionality...');

  const testItemId = '6bcca951-2e46-429e-ab14-f291589d790f';
  const testUserId = '0d7cf564-1e6d-4772-a550-1bf607420269';

  try {
    // 1. 创建一个主评论
    console.log('📝 Step 1: Creating a parent comment...');

    const { data: parentComment, error: parentError } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: testItemId,
        user_id: testUserId,
        parent_comment_id: null,
        content: 'This is a parent comment for reply testing'
      })
      .select()
      .single();

    if (parentError) {
      console.error('❌ Parent comment creation failed:', parentError);
      return;
    }

    console.log('✅ Parent comment created:', parentComment.id);

    // 2. 创建一个回复评论
    console.log('\\n🔄 Step 2: Creating a reply comment...');

    const { data: replyComment, error: replyError } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: testItemId,
        user_id: testUserId,
        parent_comment_id: parentComment.id, // 这里是关键
        content: 'This is a reply to the parent comment'
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

    if (replyError) {
      console.error('❌ Reply comment creation failed:', replyError);
      console.error('Error details:', {
        code: replyError.code,
        message: replyError.message,
        details: replyError.details,
        hint: replyError.hint
      });
    } else {
      console.log('✅ Reply comment created successfully:', replyComment.id);
    }

    // 3. 测试获取包含回复的评论
    console.log('\\n📖 Step 3: Testing getComments with replies...');

    const { data: comments, error: fetchError } = await supabaseAdmin
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
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch comments:', fetchError);
    } else {
      console.log('✅ Main comments fetched:', comments?.length || 0);

      // 为主评论获取回复
      for (const comment of comments) {
        const { data: replies, error: repliesError } = await supabaseAdmin
          .from('marketplace_comments')
          .select(`
            id,
            user_id,
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
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error(`❌ Failed to fetch replies for comment ${comment.id}:`, repliesError);
        } else {
          console.log(`✅ Comment ${comment.id} has ${replies?.length || 0} replies`);
          if (replies && replies.length > 0) {
            console.log('📄 Sample reply:', replies[0]);
          }
        }
      }
    }

    // 清理测试数据
    console.log('\\n🧹 Cleaning up test data...');

    if (replyComment) {
      await supabaseAdmin
        .from('marketplace_comments')
        .delete()
        .eq('id', replyComment.id);
      console.log('✅ Reply comment deleted');
    }

    await supabaseAdmin
      .from('marketplace_comments')
      .delete()
      .eq('id', parentComment.id);
    console.log('✅ Parent comment deleted');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\\n🎉 Reply test completed!');
}

// 运行测试
testCommentReplies();