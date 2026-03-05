import { supabaseAdmin } from '../config/database.js';

/**
 * Get comments for a marketplace item
 * GET /api/v1/marketplace/items/:itemId/comments
 */
export const getItemComments = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    const offset = (page - 1) * limit;

    // Query main comments with their replies
    const { data: comments, error, count } = await supabaseAdmin
      .from('marketplace_comments')
      .select(`
        *,
        user:users!marketplace_comments_user_id_fkey(
          id, first_name, last_name, avatar_url, email
        ),
        replies:marketplace_comments!parent_comment_id(
          *,
          user:users!marketplace_comments_user_id_fkey(
            id, first_name, last_name, avatar_url, email
          )
        )
      `, { count: 'exact' })
      .eq('item_id', itemId)
      .is('parent_comment_id', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'GET_COMMENTS_FAILED', message: 'Failed to get comments' }
      });
    }

    // Check if user has liked any comments
    if (userId && comments && comments.length > 0) {
      const allCommentIds = [];
      comments.forEach(comment => {
        allCommentIds.push(comment.id);
        if (comment.replies) {
          comment.replies.forEach(reply => allCommentIds.push(reply.id));
        }
      });

      const { data: likes } = await supabaseAdmin
        .from('marketplace_comment_likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', allCommentIds);

      const likedIds = new Set(likes?.map(l => l.comment_id) || []);

      // Mark comments as liked
      comments.forEach(comment => {
        comment.is_liked_by_user = likedIds.has(comment.id);
        if (comment.replies) {
          comment.replies.forEach(reply => {
            reply.is_liked_by_user = likedIds.has(reply.id);
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        comments: comments || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          has_more: offset + parseInt(limit) < (count || 0)
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GET_COMMENTS_FAILED', message: 'Failed to get comments' }
    });
  }
};

/**
 * Create a new comment
 * POST /api/v1/marketplace/items/:itemId/comments
 */
export const createComment = async (req, res) => {
  try {
    const { itemId} = req.params;
    const { content, parent_comment_id } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CONTENT', message: 'Comment content cannot be empty' }
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: { code: 'CONTENT_TOO_LONG', message: 'Comment must be 1000 characters or less' }
      });
    }

    // Verify item exists
    const { data: item, error: itemError } = await supabaseAdmin
      .from('marketplace_items')
      .select('id')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return res.status(404).json({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'Item not found' }
      });
    }

    // If reply, verify parent comment exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('marketplace_comments')
        .select('id')
        .eq('id', parent_comment_id)
        .eq('item_id', itemId)
        .single();

      if (parentError || !parentComment) {
        return res.status(404).json({
          success: false,
          error: { code: 'PARENT_COMMENT_NOT_FOUND', message: 'Parent comment not found' }
        });
      }
    }

    // Create comment
    const { data: comment, error } = await supabaseAdmin
      .from('marketplace_comments')
      .insert({
        item_id: itemId,
        user_id: userId,
        parent_comment_id: parent_comment_id || null,
        content: content.trim()
      })
      .select(`
        *,
        user:users!marketplace_comments_user_id_fkey(
          id, first_name, last_name, avatar_url, email
        )
      `)
      .single();

    if (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'CREATE_COMMENT_FAILED', message: 'Failed to create comment' }
      });
    }

    res.status(201).json({
      success: true,
      data: comment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_COMMENT_FAILED', message: 'Failed to create comment' }
    });
  }
};

/**
 * Like a comment
 * POST /api/v1/marketplace/comments/:commentId/like
 */
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_LIKED', message: 'You already liked this comment' }
      });
    }

    // Create like
    const { error } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId
      });

    if (error) {
      console.error('Like comment error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'LIKE_FAILED', message: 'Failed to like comment' }
      });
    }

    res.status(201).json({
      success: true,
      data: { message: 'Comment liked successfully' }
    });

  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LIKE_FAILED', message: 'Failed to like comment' }
    });
  }
};

/**
 * Unlike a comment
 * DELETE /api/v1/marketplace/comments/:commentId/like
 */
export const unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('marketplace_comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Unlike comment error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'UNLIKE_FAILED', message: 'Failed to unlike comment' }
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Comment unliked successfully' }
    });

  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UNLIKE_FAILED', message: 'Failed to unlike comment' }
    });
  }
};

/**
 * Delete a comment (soft delete)
 * DELETE /api/v1/marketplace/comments/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Verify comment ownership
    const { data: comment, error: fetchError } = await supabaseAdmin
      .from('marketplace_comments')
      .select('user_id, deleted_at')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({
        success: false,
        error: { code: 'COMMENT_NOT_FOUND', message: 'Comment not found' }
      });
    }

    if (comment.deleted_at) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_DELETED', message: 'Comment already deleted' }
      });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'You can only delete your own comments' }
      });
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('marketplace_comments')
      .update({
        deleted_at: new Date().toISOString(),
        content: '[Comment deleted]'
      })
      .eq('id', commentId);

    if (error) {
      console.error('Delete comment error:', error);
      return res.status(500).json({
        success: false,
        error: { code: 'DELETE_FAILED', message: 'Failed to delete comment' }
      });
    }

    res.status(200).json({
      success: true,
      data: { message: 'Comment deleted successfully' }
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: 'Failed to delete comment' }
    });
  }
};
