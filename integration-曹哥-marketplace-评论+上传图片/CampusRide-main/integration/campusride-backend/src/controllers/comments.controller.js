import { supabaseAdmin } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

/**
 * Get comments for a marketplace item
 */
export const getItemComments = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 10, sort = 'created_at', order = 'desc' } = req.query;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get top-level comments first
    const { data: comments, error: commentsError, count } = await supabaseAdmin
      .from('marketplace_comments')
      .select(`
        id,
        content,
        images,
        is_edited,
        likes_count,
        replies_count,
        created_at,
        updated_at,
        user:auth.users!marketplace_comments_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        item:marketplace_items!marketplace_comments_item_id_fkey(
          id,
          title,
          seller_id
        )
      `, { count: 'exact' })
      .eq('item_id', itemId)
      .is('parent_id', null)
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error('Get comments error:', commentsError);
      throw new AppError('Failed to fetch comments', 500, 'FETCH_COMMENTS_FAILED');
    }

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const { data: replies, error: repliesError } = await supabaseAdmin
          .from('marketplace_comments')
          .select(`
            id,
            content,
            images,
            is_edited,
            likes_count,
            created_at,
            updated_at,
            user:auth.users!marketplace_comments_user_id_fkey(
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true });

        if (repliesError) {
          console.error('Get replies error:', repliesError);
          return { ...comment, replies: [] };
        }

        return { ...comment, replies: replies || [] };
      })
    );

    // Check if user has liked any comments (if authenticated)
    let userLikes = [];
    if (req.user?.id) {
      const allCommentIds = [
        ...commentsWithReplies.map(c => c.id),
        ...commentsWithReplies.flatMap(c => c.replies.map(r => r.id))
      ];

      if (allCommentIds.length > 0) {
        const { data: likes } = await supabaseAdmin
          .from('marketplace_comment_likes')
          .select('comment_id')
          .eq('user_id', req.user.id)
          .in('comment_id', allCommentIds);

        userLikes = likes?.map(l => l.comment_id) || [];
      }
    }

    // Add user_has_liked flag to comments and replies
    const enrichedComments = commentsWithReplies.map(comment => ({
      ...comment,
      user_has_liked: userLikes.includes(comment.id),
      replies: comment.replies.map(reply => ({
        ...reply,
        user_has_liked: userLikes.includes(reply.id)
      }))
    }));

    res.status(200).json({
      success: true,
      data: enrichedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get item comments error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get comments'
    });
  }
};

/**
 * Create a new comment or reply
 */
export const createComment = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { content, parent_id, images = [] } = req.body;
    const userId = req.user?.id;

    // Validation
    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400, 'CONTENT_REQUIRED');
    }

    if (content.length > 2000) {
      throw new AppError('Comment content too long (max 2000 characters)', 400, 'CONTENT_TOO_LONG');
    }

    // Verify item exists and is active
    const { data: item, error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id, title, status, seller_id')
      .eq('id', itemId)
      .eq('status', 'active')
      .single();

    if (itemError || !item) {
      throw new AppError('Item not found or not active', 404, 'ITEM_NOT_FOUND');
    }

    // If replying to a comment, verify parent exists
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('marketplace_comments')
        .select('id, item_id')
        .eq('id', parent_id)
        .eq('item_id', itemId)
        .single();

      if (parentError || !parentComment) {
        throw new AppError('Parent comment not found', 404, 'PARENT_COMMENT_NOT_FOUND');
      }
    }

    // Create comment
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: itemId,
        user_id: userId,
        parent_id: parent_id || null,
        content: content.trim(),
        images: images || []
      })
      .select(`
        id,
        content,
        images,
        is_edited,
        likes_count,
        replies_count,
        created_at,
        updated_at,
        user:auth.users!marketplace_comments_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (commentError) {
      console.error('Create comment error:', commentError);
      throw new AppError('Failed to create comment', 500, 'CREATE_COMMENT_FAILED');
    }

    res.status(201).json({
      success: true,
      data: {
        ...comment,
        user_has_liked: false,
        replies: []
      },
      message: 'Comment created successfully'
    });

  } catch (error) {
    console.error('Create comment error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create comment'
    });
  }
};

/**
 * Update a comment
 */
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, images } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400, 'CONTENT_REQUIRED');
    }

    if (content.length > 2000) {
      throw new AppError('Comment content too long (max 2000 characters)', 400, 'CONTENT_TOO_LONG');
    }

    // Verify comment exists and user owns it
    const { data: existingComment, error: fetchError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('id, user_id, content')
      .eq('id', commentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingComment) {
      throw new AppError('Comment not found or access denied', 404, 'COMMENT_NOT_FOUND');
    }

    // Update comment
    const { data: comment, error: updateError } = await supabaseAdmin
      .from('marketplace_comments')
      .update({
        content: content.trim(),
        images: images || existingComment.images || [],
        is_edited: true
      })
      .eq('id', commentId)
      .select(`
        id,
        content,
        images,
        is_edited,
        likes_count,
        replies_count,
        created_at,
        updated_at,
        user:auth.users!marketplace_comments_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Update comment error:', updateError);
      throw new AppError('Failed to update comment', 500, 'UPDATE_COMMENT_FAILED');
    }

    res.status(200).json({
      success: true,
      data: comment,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Update comment error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update comment'
    });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Verify comment exists and check permissions
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('marketplace_comments')
      .select(`
        id,
        user_id,
        item_id,
        item:marketplace_items!marketplace_comments_item_id_fkey(seller_id)
      `)
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    // Check if user can delete (comment author or item seller)
    const canDelete = comment.user_id === userId || comment.item.seller_id === userId;

    if (!canDelete) {
      throw new AppError('Access denied', 403, 'ACCESS_DENIED');
    }

    // Delete comment (this will cascade to replies and likes)
    const { error: deleteError } = await supabaseAdmin
      .from('marketplace_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Delete comment error:', deleteError);
      throw new AppError('Failed to delete comment', 500, 'DELETE_COMMENT_FAILED');
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete comment'
    });
  }
};

/**
 * Like or unlike a comment
 */
export const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Check if comment exists
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('id, likes_count')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    // Check if user already liked
    const { data: existingLike, error: likeError } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    let isLiked = false;
    let newLikesCount = comment.likes_count;

    if (existingLike) {
      // Unlike - remove like
      const { error: deleteError } = await supabaseAdmin
        .from('marketplace_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new AppError('Failed to remove like', 500, 'UNLIKE_FAILED');
      }

      isLiked = false;
      newLikesCount = Math.max(0, comment.likes_count - 1);
    } else {
      // Like - add like
      const { error: insertError } = await supabaseAdmin
        .from('marketplace_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          reaction_type: 'like'
        });

      if (insertError) {
        throw new AppError('Failed to add like', 500, 'LIKE_FAILED');
      }

      isLiked = true;
      newLikesCount = comment.likes_count + 1;
    }

    res.status(200).json({
      success: true,
      data: {
        comment_id: commentId,
        is_liked: isLiked,
        likes_count: newLikesCount
      },
      message: isLiked ? 'Comment liked' : 'Comment unliked'
    });

  } catch (error) {
    console.error('Toggle comment like error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to toggle like'
    });
  }
};

/**
 * Get user's commented items
 */
export const getUserComments = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const offset = (page - 1) * limit;

    const { data: comments, error, count } = await supabaseAdmin
      .from('marketplace_comments')
      .select(`
        id,
        content,
        is_edited,
        likes_count,
        replies_count,
        created_at,
        item:marketplace_items!marketplace_comments_item_id_fkey(
          id,
          title,
          price,
          images
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get user comments error:', error);
      throw new AppError('Failed to fetch user comments', 500, 'FETCH_USER_COMMENTS_FAILED');
    }

    res.status(200).json({
      success: true,
      data: comments || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Get user comments error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.errorCode,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get user comments'
    });
  }
};

export default {
  getItemComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getUserComments
};