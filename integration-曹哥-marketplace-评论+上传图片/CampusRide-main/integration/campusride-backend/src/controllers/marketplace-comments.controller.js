import { supabaseAdmin } from '../config/database.js';
import { AppError, ERROR_CODES } from '../middleware/error.middleware.js';
import socketManager from '../config/socket.js';

// 获取商品评论列表 (修复版本，使用正确的字段名)
export const getComments = async (req, res, next) => {
  try {
    console.log('🔍 getComments called with params:', req.params);
    console.log('🔍 getComments called with query:', req.query);
    console.log('🔍 Full req.url:', req.url);
    console.log('🔍 Full req.originalUrl:', req.originalUrl);
    console.log('🔍 Full req.path:', req.path);
    console.log('🔍 Full req.route?.path:', req.route?.path);

    const { itemId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    console.log('🔍 Extracted itemId:', itemId);
    console.log('🔍 itemId type:', typeof itemId);
    console.log('🔍 itemId truth:', !!itemId);

    // 验证itemId
    if (!itemId) {
      console.error('❌ itemId is missing from request');
      throw new AppError('Item ID is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    const offset = (page - 1) * limit;

    // 构建排序条件
    let orderBy = 'created_at';
    let ascending = false;

    switch (sort) {
      case 'oldest':
        ascending = true;
        break;
      case 'most_liked':
        orderBy = 'likes_count';
        break;
      default:
        orderBy = 'created_at';
    }

    console.log('🔍 About to query with:', { itemId, orderBy, ascending, offset, limit });

    // 验证itemId再次确认
    if (!itemId) {
      console.error('❌ itemId is missing from req.params:', req.params);
      throw new AppError('Item ID is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    // 使用正确的字段名查询评论
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
      .eq('item_id', itemId)
      .is('parent_comment_id', null)  // 只获取主评论
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('🚨 getComments database error:', error);
      console.error('Query details:', { itemId, orderBy, ascending, offset, limit });
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // 如果是数据库表不存在的错误，返回空结果而不是错误
      if (error.message?.includes('table') || error.message?.includes('relation') || error.code === 'PGRST106') {
        console.warn('📝 Comments table might not exist, returning empty results');
        return res.json({
          success: true,
          data: {
            comments: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              hasMore: false
            }
          }
        });
      }

      throw new AppError(`Failed to fetch comments: ${error.message}`, 500, ERROR_CODES.DATABASE_ERROR);
    }

    // 为每个评论添加缺失的字段并获取回复
    const commentsWithDefaults = await Promise.all(
      comments.map(async (comment) => {
        // 获取回复
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

        return {
          ...comment,
          parent_id: comment.parent_comment_id,  // 映射字段名
          images: [],
          is_edited: false,
          dislikes_count: 0,
          replies_count: replies?.length || 0,
          replies: (replies || []).map(reply => ({
            ...reply,
            parent_id: reply.parent_comment_id,
            images: [],
            is_edited: false,
            dislikes_count: 0,
            users: {
              ...reply.users,
              username: reply.users.student_id  // 使用student_id作为username
            }
          })),
          users: {
            ...comment.users,
            username: comment.users.student_id  // 使用student_id作为username
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        comments: commentsWithDefaults,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: comments.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 创建评论 (修复版本，使用正确的字段名)
export const createComment = async (req, res, next) => {
  try {
    console.log('💬 ========== createComment START ==========');
    console.log('💬 Full req.url:', req.url);
    console.log('💬 Full req.originalUrl:', req.originalUrl);
    console.log('💬 Full req.path:', req.path);
    console.log('💬 Full req.route?.path:', req.route?.path);
    console.log('💬 req.params (raw):', req.params);
    console.log('💬 req.params (JSON):', JSON.stringify(req.params));
    console.log('💬 req.body:', req.body);
    console.log('💬 req.user?.id:', req.user?.id);

    const userId = req.user.id;
    const itemId = req.params.itemId;
    const { content, parentId = null } = req.body;

    console.log('💬 Extracted values:');
    console.log('  - userId:', userId, '(type:', typeof userId, ')');
    console.log('  - itemId:', itemId, '(type:', typeof itemId, ')');
    console.log('  - content:', content?.substring(0, 50), '(type:', typeof content, ')');
    console.log('  - parentId:', parentId, '(type:', typeof parentId, ')');

    // 验证内容
    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    if (content.length > 2000) {
      throw new AppError('Comment content too long (max 2000 characters)', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 验证商品是否存在
    const { data: item, error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, seller_id')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      throw new AppError('Item not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 如果是回复，验证父评论是否存在
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('marketplace_comments')
        .select('id, item_id')
        .eq('id', parentId)
        .eq('item_id', itemId)
        .single();

      if (parentError || !parentComment) {
        throw new AppError('Parent comment not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      }
    }

    // 创建评论 (使用正确的字段名)
    const { data: comment, error } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: itemId,
        user_id: userId,
        parent_comment_id: parentId,  // 使用正确的字段名
        content: content.trim()
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

    if (error) {
      console.error('🚨 createComment database error:', error);
      console.error('Insert data:', { item_id: itemId, user_id: userId, parent_comment_id: parentId, content: content.trim() });
      console.error('Full error object:', JSON.stringify(error, null, 2));

      // 如果是数据库表不存在的错误
      if (error.message?.includes('table') || error.message?.includes('relation') || error.code === 'PGRST106') {
        console.warn('📝 Comments table might not exist, comment creation failed');
        throw new AppError('Comments feature is currently unavailable', 503, ERROR_CODES.SERVICE_UNAVAILABLE);
      }

      throw new AppError(`Failed to create comment: ${error.message}`, 500, ERROR_CODES.DATABASE_ERROR);
    }

    // 更新商品的评论数
    if (!parentId) {  // 只有主评论才增加商品评论数
      // 先获取当前评论数
      const { data: currentItem } = await supabaseAdmin
        .from('marketplace_items')
        .select('comments_count')
        .eq('id', itemId)
        .single();

      // 更新评论数
      await supabaseAdmin
        .from('marketplace_items')
        .update({
          comments_count: (currentItem?.comments_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);
    }

    // 发送实时通知 (安全处理socket)
    try {
      const io = socketManager.getIO();
      if (io && userId !== item.seller_id) {
        io.to(`user-${item.seller_id}`).emit('new-comment', {
          type: parentId ? 'reply' : 'comment',
          itemId,
          commentId: comment.id,
          from: comment.users,
          content: comment.content
        });
      }

      // 如果是回复，通知被回复的用户
      if (parentId && io) {
        const { data: parentComment } = await supabaseAdmin
          .from('marketplace_comments')
          .select('user_id')
          .eq('id', parentId)
          .single();

        if (parentComment && parentComment.user_id !== userId) {
          io.to(`user-${parentComment.user_id}`).emit('comment-reply', {
            itemId,
            commentId: comment.id,
            parentCommentId: parentId,
            from: comment.users,
            content: comment.content
          });
        }
      }
    } catch (socketError) {
      console.warn('⚠️ Socket notification failed (non-critical):', socketError.message);
      // 不抛出错误，因为评论已经成功创建
    }

    // 添加缺失字段的默认值并映射字段名
    const commentWithDefaults = {
      ...comment,
      parent_id: comment.parent_comment_id,  // 映射字段名
      images: [],
      is_edited: false,
      dislikes_count: 0,
      replies_count: 0,
      replies: [],
      users: {
        ...comment.users,
        username: comment.users.student_id  // 使用student_id作为username
      }
    };

    res.status(201).json({
      success: true,
      data: commentWithDefaults
    });
  } catch (error) {
    next(error);
  }
};

// 删除评论 (简化版本)
export const deleteComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    // 获取评论信息
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('id, user_id, item_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      throw new AppError('Comment not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 验证权限
    if (comment.user_id !== userId) {
      throw new AppError('Not authorized to delete this comment', 403, ERROR_CODES.UNAUTHORIZED);
    }

    // 删除评论
    const { error: deleteError } = await supabaseAdmin
      .from('marketplace_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      throw new AppError('Failed to delete comment', 500, ERROR_CODES.DATABASE_ERROR);
    }

    // 更新商品的评论数
    const { data: currentItem } = await supabaseAdmin
      .from('marketplace_items')
      .select('comments_count')
      .eq('id', comment.item_id)
      .single();

    await supabaseAdmin
      .from('marketplace_items')
      .update({
        comments_count: Math.max(0, (currentItem?.comments_count || 0) - 1),
        updated_at: new Date().toISOString()
      })
      .eq('id', comment.item_id);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 更新评论 (简化版本)
export const updateComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { content } = req.body;

    // 验证内容
    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    if (content.length > 2000) {
      throw new AppError('Comment content too long (max 2000 characters)', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    // 获取评论信息
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      throw new AppError('Comment not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 验证权限
    if (comment.user_id !== userId) {
      throw new AppError('Not authorized to update this comment', 403, ERROR_CODES.UNAUTHORIZED);
    }

    // 更新评论
    const { data: updatedComment, error } = await supabaseAdmin
      .from('marketplace_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
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
      .single();

    if (error) {
      throw new AppError('Failed to update comment', 500, ERROR_CODES.DATABASE_ERROR);
    }

    // 添加缺失字段的默认值
    const commentWithDefaults = {
      ...updatedComment,
      parent_id: null,
      images: [],
      is_edited: true,
      dislikes_count: 0,
      replies_count: 0
    };

    res.json({
      success: true,
      data: commentWithDefaults
    });
  } catch (error) {
    next(error);
  }
};

// 点赞/取消点赞评论 (简化版本)
export const toggleLike = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    // 检查评论是否存在
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('id, likes_count')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      throw new AppError('Comment not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 检查是否已经点赞
    const { data: existingLike, error: likeError } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('reaction_type', 'like')
      .single();

    let isLiked = false;
    let likesChange = 0;

    if (existingLike) {
      // 取消点赞
      await supabaseAdmin
        .from('marketplace_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('reaction_type', 'like');

      likesChange = -1;
    } else {
      // 添加点赞
      await supabaseAdmin
        .from('marketplace_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          reaction_type: 'like'
        });

      likesChange = 1;
      isLiked = true;
    }

    // 更新评论点赞数
    const { data: updatedComment, error: updateError } = await supabaseAdmin
      .from('marketplace_comments')
      .update({
        likes_count: comment.likes_count + likesChange,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('likes_count')
      .single();

    if (updateError) {
      throw new AppError('Failed to update like count', 500, ERROR_CODES.DATABASE_ERROR);
    }

    res.json({
      success: true,
      data: {
        isLiked,
        likesCount: updatedComment.likes_count
      }
    });
  } catch (error) {
    next(error);
  }
};

// 点踩功能 (临时简化版本，等待数据库列添加后完善)
export const toggleDislike = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    // 检查评论是否存在
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      throw new AppError('Comment not found', 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // 检查现有反应
    const { data: existingDislike } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('reaction_type', 'dislike')
      .single();

    const { data: existingLike } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('reaction_type', 'like')
      .single();

    let isDisliked = false;

    if (existingDislike) {
      // 取消点踩
      await supabaseAdmin
        .from('marketplace_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('reaction_type', 'dislike');
    } else {
      // 如果有点赞，先移除
      if (existingLike) {
        await supabaseAdmin
          .from('marketplace_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId)
          .eq('reaction_type', 'like');

        // 更新点赞数
        const { data: currentComment } = await supabaseAdmin
          .from('marketplace_comments')
          .select('likes_count')
          .eq('id', commentId)
          .single();

        await supabaseAdmin
          .from('marketplace_comments')
          .update({
            likes_count: Math.max(0, (currentComment?.likes_count || 0) - 1),
            updated_at: new Date().toISOString()
          })
          .eq('id', commentId);
      }

      // 添加点踩
      await supabaseAdmin
        .from('marketplace_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          reaction_type: 'dislike'
        });

      isDisliked = true;
    }

    res.json({
      success: true,
      data: {
        isDisliked,
        dislikesCount: 0 // 临时返回0，等待数据库列添加
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户对评论的点赞状态
export const getLikeStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { commentIds } = req.body;

    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      throw new AppError('Comment IDs array is required', 400, ERROR_CODES.REQUIRED_FIELD_MISSING);
    }

    const { data: likes, error } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds);

    if (error) {
      throw new AppError('Failed to fetch like status', 500, ERROR_CODES.DATABASE_ERROR);
    }

    const likedComments = likes.map(like => like.comment_id);

    res.json({
      success: true,
      data: likedComments
    });
  } catch (error) {
    next(error);
  }
};