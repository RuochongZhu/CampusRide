import { supabaseAdmin } from '../config/database.js';

class ActivityCommentService {
  // 获取活动评论
  async getActivityComments(activityId, params = {}) {
    try {
      const { limit = 50, offset = 0 } = params;

      const { data: comments, error, count } = await supabaseAdmin
        .from('activity_comments')
        .select(`
          *,
          user:users!user_id(
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        `, { count: 'exact' })
        .eq('activity_id', activityId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        comments: comments || [],
        total: count
      };
    } catch (error) {
      console.error('❌ 获取活动评论失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 添加活动评论
  async addActivityComment(activityId, userId, content) {
    try {
      // 验证活动是否存在
      const { data: activity, error: activityError } = await supabaseAdmin
        .from('activities')
        .select('id, title')
        .eq('id', activityId)
        .single();

      if (activityError || !activity) {
        throw new Error('活动不存在');
      }

      // 验证内容长度
      const trimmedContent = content.trim();
      if (trimmedContent.length < 5) {
        throw new Error('评论内容至少需要5个字符');
      }
      if (trimmedContent.length > 2000) {
        throw new Error('评论内容不能超过2000个字符');
      }

      // 创建评论
      const { data: comment, error: createError } = await supabaseAdmin
        .from('activity_comments')
        .insert({
          activity_id: activityId,
          user_id: userId,
          content: trimmedContent
        })
        .select(`
          *,
          user:users!user_id(
            id,
            first_name,
            last_name,
            avatar_url,
            email
          )
        `)
        .single();

      if (createError) throw createError;

      console.log(`✅ 评论添加成功: 用户 ${userId} 评论活动 ${activity.title}`);

      return {
        success: true,
        comment
      };
    } catch (error) {
      console.error('❌ 添加活动评论失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 删除活动评论
  async deleteActivityComment(commentId, userId) {
    try {
      // 验证评论是否存在且属于当前用户
      const { data: comment, error: fetchError } = await supabaseAdmin
        .from('activity_comments')
        .select('*')
        .eq('id', commentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !comment) {
        throw new Error('评论不存在或您没有权限删除此评论');
      }

      // 删除评论
      const { error: deleteError } = await supabaseAdmin
        .from('activity_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      console.log(`✅ 评论删除成功: 评论ID ${commentId}`);

      return {
        success: true,
        message: '评论已删除'
      };
    } catch (error) {
      console.error('❌ 删除活动评论失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取评论统计
  async getCommentStats(activityId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_comments')
        .select('id', { count: 'exact', head: true })
        .eq('activity_id', activityId);

      if (error) throw error;

      return {
        success: true,
        commentCount: data?.length || 0
      };
    } catch (error) {
      console.error('❌ 获取评论统计失败:', error);
      return {
        success: false,
        error: error.message,
        commentCount: 0
      };
    }
  }

  // 批量获取多个活动的评论数量
  async getBatchCommentCounts(activityIds) {
    try {
      const { data, error } = await supabaseAdmin
        .from('activity_comments')
        .select('activity_id')
        .in('activity_id', activityIds);

      if (error) throw error;

      // 统计每个活动的评论数量
      const counts = {};
      activityIds.forEach(id => counts[id] = 0);

      if (data) {
        data.forEach(comment => {
          counts[comment.activity_id] = (counts[comment.activity_id] || 0) + 1;
        });
      }

      return {
        success: true,
        counts
      };
    } catch (error) {
      console.error('❌ 批量获取评论数量失败:', error);
      return {
        success: false,
        error: error.message,
        counts: {}
      };
    }
  }
}

const activityCommentService = new ActivityCommentService();
export default activityCommentService;